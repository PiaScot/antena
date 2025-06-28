<script lang="ts">
import type { SuperCategoryGroup, Category } from "$lib/types";
import { isLayoutEditMode } from "$lib/stores/uiStore";
import { dndzone } from "svelte-dnd-action";
import CategoryCard from "$lib/components/CategoryCard.svelte";
import { GripVertical, Trash2, Plus, Check, X } from "@lucide/svelte";
import {
	superCategoryGroups,
	categories as categoriesStore,
} from "$lib/stores/categoryStore";
import { slide } from "svelte/transition";

const { group } = $props<{ group: SuperCategoryGroup }>();

// --- State for Super Category Label Editing ---
let isEditingLabel = $state(false);
let editingLabel = $state(group.label);
let labelInputElement = $state<HTMLInputElement>();

// --- State for Adding New Child Category ---
let isAddingCategory = $state(false);
let newCategoryLabel = $state("");
let newCategoryId = $state("");
let newCategoryInputElement = $state<HTMLInputElement>();

// --- Super Category Functions ---
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
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ label: editingLabel.trim() }),
		});
		if (!res.ok) throw new Error("Failed to update label");

		superCategoryGroups.update((groups) =>
			groups.map((g) =>
				g.id === group.id ? { ...g, label: editingLabel.trim() } : g,
			),
		);
	} catch (err) {
		console.error("Label update failed:", err);
		alert("ラベルの更新に失敗しました。");
		editingLabel = group.label;
	} finally {
		isEditingLabel = false;
	}
}

async function handleDeleteGroup() {
	if (
		!confirm(
			`大カテゴリ「${group.label}」を削除しますか？\n中のカテゴリは「未分類」に移動します。`,
		)
	)
		return;

	try {
		const res = await fetch(`/api/super-categories/${group.id}`, {
			method: "DELETE",
		});
		if (res.status !== 204) throw new Error("Failed to delete group");

		superCategoryGroups.update((groups) =>
			groups.filter((g) => g.id !== group.id),
		);
		categoriesStore.update((cats) =>
			cats.map((c) =>
				c.super_category_id === group.id
					? { ...c, super_category_id: null }
					: c,
			),
		);
	} catch (err) {
		console.error("Group deletion failed:", err);
		alert("グループの削除に失敗しました。");
	}
}

// --- Child Category Functions ---
function showAddCategoryForm() {
	isAddingCategory = true;
	setTimeout(() => newCategoryInputElement?.focus(), 0);
}

function cancelAddCategory() {
	isAddingCategory = false;
	newCategoryLabel = "";
	newCategoryId = "";
}

async function submitNewCategory() {
	if (!newCategoryLabel.trim() || !newCategoryId.trim()) {
		cancelAddCategory();
		return;
	}
	if (!/^[a-z0-9-_]+$/.test(newCategoryId)) {
		alert("IDは半角英数字、ハイフン、アンダースコアのみ使用できます。");
		return;
	}

	try {
		const res = await fetch("/api/category", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				id: newCategoryId,
				label: newCategoryLabel,
				super_category_id: group.id,
			}),
		});
		if (!res.ok) {
			const errorData = await res.json();
			throw new Error(errorData.error || "Failed to add category");
		}

		const newCategory: Category = await res.json();

		categoriesStore.update((cats) => [...cats, newCategory]);
		superCategoryGroups.update((groups) =>
			groups.map((g) =>
				g.id === group.id
					? { ...g, categories: [...g.categories, newCategory] }
					: g,
			),
		);

		cancelAddCategory();
	} catch (err) {
		console.error("Failed to add category:", err);
		alert(`カテゴリの追加に失敗しました:\n${(err as Error).message}`);
	}
}

async function handleDrop(
	e: CustomEvent<{
		items: Category[];
		info: { id: string; source: { id: number | "uncategorized" } };
	}>,
) {
	group.categories = e.detail.items;

	const droppedItemId = e.detail.info.id;
	const sourceGroupId = e.detail.info.source.id;
	const targetGroupId = group.id;

	if (sourceGroupId !== targetGroupId) {
		console.log(
			`Moving category ${droppedItemId} from group ${sourceGroupId} to ${targetGroupId}`,
		);
		try {
			const droppedItem = $categoriesStore.find((c) => c.id === droppedItemId);
			if (!droppedItem) throw new Error("Dropped item not found in store");

			const res = await fetch("/api/category", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					originalId: droppedItemId,
					id: droppedItemId,
					label: droppedItem.label,
					super_category_id:
						targetGroupId === "uncategorized" ? null : targetGroupId,
				}),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(
					errorData.error || "API call to update super_category_id failed",
				);
			}

			categoriesStore.update((cats) =>
				cats.map((c) =>
					c.id === droppedItemId
						? {
								...c,
								super_category_id:
									targetGroupId === "uncategorized" ? null : targetGroupId,
							}
						: c,
				),
			);
		} catch (err) {
			console.error("Failed to persist category move:", err);
			alert(
				"カテゴリのグループ移動に失敗しました。ページをリロードしてやり直してください。",
			);
		}
	}
}
</script>

<!-- ★★★ The root element no longer needs the dndzone action ★★★ -->
<section class="flex flex-col">
	<!-- Header section -->
	{#if $isLayoutEditMode}
		<!-- Edit Mode Header -->
		<header 
			class="relative flex items-center gap-2 mb-3"
			use:dndzone={{ items: [group], id: `super-${group.id}`, type: 'super-category' }}
		>
			<button class="cursor-grab text-slate-400 hover:text-slate-600" title="このグループをドラッグ">
				<GripVertical />
			</button>
			
			<div class="flex-1 text-lg sm:text-xl font-bold text-center text-slate-700 dark:text-slate-200 
					   bg-slate-200 dark:bg-slate-700/50 rounded-lg py-2 shadow-sm">
				{#if isEditingLabel}
					<input
						type="text"
						bind:this={labelInputElement}
						bind:value={editingLabel}
						class="w-full bg-transparent text-center focus:outline-none"
						onblur={handleLabelUpdate}
						onkeydown={e => e.key === 'Enter' && handleLabelUpdate()}
					/>
				{:else}
					<span onclick={startEditingLabel} class="block w-full">{group.label}</span>
				{/if}
			</div>

			<button class="text-slate-400 hover:text-red-500" title="このグループを削除" onclick={handleDeleteGroup}>
				<Trash2 class="w-5 h-5" />
			</button>
		</header>
	{:else}
		<!-- View Mode Header -->
		<header class="mb-3">
			<h2 class="text-xl font-bold pb-2 border-b-2 border-emerald-500 text-slate-800 dark:text-slate-200">
				{group.label}
			</h2>
		</header>
	{/if}


	<!-- Child categories container -->
	{#if $isLayoutEditMode}
		<!-- ★★★ In Edit Mode, the div is a dropzone ★★★ -->
		<div
			class="grid grid-cols-2 gap-2 min-h-[5rem] rounded-lg p-2 bg-slate-200/50 dark:bg-slate-800/50 transition-colors"
			use:dndzone={{ items: group.categories, id: group.id, type: 'category' }}
			onfinalize={handleDrop}
		>
			{#each group.categories as cat (cat.id)}
				<CategoryCard {cat} />
			{/each}

			<!-- Add New Category placeholder / form -->
			{#if !isAddingCategory}
				<div transition:slide|local>
					<button 
						class="flex items-center justify-center h-16 md:h-20 p-2 rounded-xl border-2 border-dashed border-slate-400 hover:border-emerald-500 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 transition-colors w-full"
						onclick={showAddCategoryForm}
					>
						<Plus class="w-8 h-8" />
					</button>
				</div>
			{:else}
				<div class="relative flex flex-col gap-1 justify-center h-16 md:h-20 p-2 rounded-xl border-2 border-emerald-500 bg-emerald-500/10" transition:slide|local>
					<input type="text" bind:value={newCategoryLabel} bind:this={newCategoryInputElement} placeholder="カテゴリ名" class="w-full text-sm bg-white/50 dark:bg-slate-800/50 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400">
					<input type="text" bind:value={newCategoryId} placeholder="ID (英数字と-)" class="w-full text-sm bg-white/50 dark:bg-slate-800/50 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400" onkeydown={e => e.key === 'Enter' && submitNewCategory()}>
					<div class="absolute top-1 right-1 flex gap-1">
						<button class="p-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-600" onclick={submitNewCategory} title="追加"><Check class="w-4 h-4"/></button>
						<button class="p-1 rounded-full bg-slate-400 text-white hover:bg-slate-500" onclick={cancelAddCategory} title="キャンセル"><X class="w-4 h-4"/></button>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<!-- ★★★ In View Mode, the div is a simple container with no dndzone ★★★ -->
		<div class="grid grid-cols-2 gap-2">
			{#each group.categories as cat (cat.id)}
				<CategoryCard {cat} />
			{/each}
		</div>
	{/if}
</section>
