<script lang="ts">
	import type { SuperCategoryGroup, Category } from '$lib/types';
	import { isLayoutEditMode } from '$lib/stores/uiStore';
	import { dndzone } from 'svelte-dnd-action';
	import CategoryCard from '$lib/components/CategoryCard.svelte';
	import { GripVertical, Trash2, Plus, Check, X } from '@lucide/svelte';
	import {
		superCategoryGroups,
		categories as categoriesStore
	} from '$lib/stores/categoryStore';
	import { slide } from 'svelte/transition';

	const { group } = $props<{ group: SuperCategoryGroup }>();

	let isEditingLabel = $state(false);
	let editingLabel = $state(group.label);
	let labelInputElement: HTMLInputElement | undefined = $state();
	let isAddingCategory = $state(false);
	let newCategoryLabel = $state('');
	let newCategoryId = $state('');
	let newCategoryInputElement: HTMLInputElement | undefined = $state();

	function startEditingLabel() {
		if (!$isLayoutEditMode) return;
		isEditingLabel = true;
		editingLabel = group.label;
		setTimeout(() => labelInputElement?.focus(), 0);
	}

	async function handleLabelUpdate() {
		if (
			!isEditingLabel ||
			!editingLabel.trim() ||
			editingLabel.trim() === group.label
		) {
			isEditingLabel = false;
			editingLabel = group.label;
			return;
		}
		try {
			const res = await fetch(`/api/super-categories/${group.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ label: editingLabel.trim() })
			});
			if (!res.ok) throw new Error('Failed to update label');
			superCategoryGroups.update((groups) =>
				groups.map((g) =>
					g.id === group.id ? { ...g, label: editingLabel.trim() } : g
				)
			);
		} catch (err) {
			console.error('Label update failed:', err);
			alert('ラベルの更新に失敗しました。');
			editingLabel = group.label;
		} finally {
			isEditingLabel = false;
		}
	}

	async function handleDeleteGroup() {
		if (
			!confirm(
				`大カテゴリ「${group.label}」を削除しますか？\n中のカテゴリは「未分類」に移動します。`
			)
		)
			return;
		try {
			const res = await fetch(`/api/super-categories/${group.id}`, {
				method: 'DELETE'
			});
			if (res.status !== 204) throw new Error('Failed to delete group');
			superCategoryGroups.update((groups) =>
				groups.filter((g) => g.id !== group.id)
			);
			categoriesStore.update((cats) =>
				cats.map((c) =>
					c.super_category_id === group.id
						? { ...c, super_category_id: null }
						: c
				)
			);
		} catch (err) {
			console.error('Group deletion failed:', err);
			alert('グループの削除に失敗しました。');
		}
	}

	function showAddCategoryForm() {
		isAddingCategory = true;
		setTimeout(() => newCategoryInputElement?.focus(), 0);
	}

	function cancelAddCategory() {
		isAddingCategory = false;
		newCategoryLabel = '';
		newCategoryId = '';
	}

	async function submitNewCategory() {
		if (!newCategoryLabel.trim() || !newCategoryId.trim()) {
			cancelAddCategory();
			return;
		}
		if (!/^[a-z0-9-_]+$/.test(newCategoryId)) {
			alert('IDは半角英数字、ハイフン、アンダースコアのみ使用できます。');
			return;
		}
		try {
			const res = await fetch('/api/category', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: newCategoryId,
					label: newCategoryLabel,
					super_category_id: group.id
				})
			});
			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || 'Failed to add category');
			}
			const newCategory: Category = await res.json();
			categoriesStore.update((cats) => [...cats, newCategory]);
			superCategoryGroups.update((groups) =>
				groups.map((g) =>
					g.id === group.id
						? { ...g, categories: [...g.categories, newCategory] }
						: g
				)
			);
			cancelAddCategory();
		} catch (err) {
			console.error('Failed to add category:', err);
			alert(`カテゴリの追加に失敗しました:\n${(err as Error).message}`);
		}
	}

	async function handleDrop(e: CustomEvent) {
		const detail = e.detail as {
			items: Category[];
			info: { id: string; source: { id: number | 'uncategorized' } };
		};

		group.categories = detail.items;

		const droppedItemId = detail.info.id;
		const sourceGroupId = detail.info.source.id;
		const targetGroupId = group.id;

		if (sourceGroupId !== targetGroupId) {
			try {
				const droppedItem = $categoriesStore.find(
					(c) => c.id === droppedItemId
				);
				if (!droppedItem) throw new Error('Dropped item not found in store');
				const res = await fetch('/api/category', {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						originalId: droppedItemId,
						id: droppedItemId,
						label: droppedItem.label,
						super_category_id:
							targetGroupId === 'uncategorized' ? null : targetGroupId
					})
				});
				if (!res.ok) {
					const errorData = await res.json();
					throw new Error(
						errorData.error || 'API call to update super_category_id failed'
					);
				}
				categoriesStore.update((cats) =>
					cats.map((c) =>
						c.id === droppedItemId
							? {
									...c,
									super_category_id:
										targetGroupId === 'uncategorized' ? null : targetGroupId
								}
							: c
					)
				);
			} catch (err) {
				console.error('Failed to persist category move:', err);
				alert(
					'カテゴリのグループ移動に失敗しました。ページをリロードしてやり直してください。'
				);
			}
		}
	}
</script>

{#if $isLayoutEditMode}
	<section class="flex flex-col">
		<header class="relative mb-3 flex items-center gap-2">
			<span
				class="cursor-grab text-slate-400 hover:text-slate-600"
				title="このグループをドラッグ"
			>
				<GripVertical />
			</span>

			<div
				class="flex-1 rounded-lg bg-slate-200 py-2 text-center text-lg font-bold text-slate-700 shadow-sm sm:text-xl dark:bg-slate-700/50 dark:text-slate-200"
			>
				{#if isEditingLabel}
					<input
						type="text"
						bind:this={labelInputElement}
						bind:value={editingLabel}
						class="w-full bg-transparent text-center focus:outline-none"
						onblur={handleLabelUpdate}
						onkeydown={(e) => e.key === 'Enter' && handleLabelUpdate()}
					/>
				{:else}
					<button
						type="button"
						onclick={startEditingLabel}
						class="block w-full appearance-none bg-transparent text-inherit"
					>
						{group.label}
					</button>
				{/if}
			</div>

			<button
				class="text-slate-400 hover:text-red-500"
				title="このグループを削除"
				onclick={handleDeleteGroup}
			>
				<Trash2 class="h-5 w-5" />
			</button>
		</header>

		<div
			class="grid min-h-[5rem] grid-cols-2 gap-2 rounded-lg bg-slate-200/50 p-2 transition-colors dark:bg-slate-800/50"
			use:dndzone={{ items: group.categories, type: 'category' }}
			onfinalize={handleDrop}
		>
			{#each group.categories as cat (cat.id)}
				<CategoryCard {cat} />
			{/each}

			{#if !isAddingCategory}
				<div transition:slide|local>
					<button
						class="flex h-16 w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-400 p-2 text-slate-400 transition-colors hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500 md:h-20"
						onclick={showAddCategoryForm}
					>
						<Plus class="h-8 w-8" />
					</button>
				</div>
			{:else}
				<div
					class="transition:slide|local relative flex h-16 flex-col justify-center gap-1 rounded-xl border-2 border-emerald-500 bg-emerald-500/10 p-2 md:h-20"
				>
					<input
						type="text"
						bind:value={newCategoryLabel}
						bind:this={newCategoryInputElement}
						placeholder="カテゴリ名"
						class="w-full rounded bg-white/50 px-2 py-1 text-sm focus:ring-1 focus:ring-emerald-400 focus:outline-none dark:bg-slate-800/50"
					/>
					<input
						type="text"
						bind:value={newCategoryId}
						placeholder="ID (英数字と-)"
						class="w-full rounded bg-white/50 px-2 py-1 text-sm focus:ring-1 focus:ring-emerald-400 focus:outline-none dark:bg-slate-800/50"
						onkeydown={(e) => e.key === 'Enter' && submitNewCategory()}
					/>
					<div class="absolute top-1 right-1 flex gap-1">
						<button
							class="rounded-full bg-emerald-500 p-1 text-white hover:bg-emerald-600"
							onclick={submitNewCategory}
							title="追加"><Check class="h-4 w-4" /></button
						>
						<button
							class="rounded-full bg-slate-400 p-1 text-white hover:bg-slate-500"
							onclick={cancelAddCategory}
							title="キャンセル"><X class="h-4 w-4" /></button
						>
					</div>
				</div>
			{/if}
		</div>
	</section>
{:else}
	<section class="flex flex-col">
		<header class="mb-3">
			<h2
				class="border-b-2 border-emerald-500 pb-2 text-xl font-bold text-slate-800 dark:text-slate-200"
			>
				{group.label}
			</h2>
		</header>
		<div class="grid grid-cols-2 gap-2 pt-2">
			{#each group.categories as cat (cat.id)}
				<CategoryCard {cat} />
			{/each}
		</div>
	</section>
{/if}
