<script lang="ts">
	import { superCategoryGroups } from '$lib/stores/categoryStore';
	import SuperCategoryGroup from '$lib/components/SuperCategoryGroup.svelte';
	import { Plus, Check, X } from '@lucide/svelte';
	import type {
		SuperCategory,
		SuperCategoryGroup as SuperCategoryGroupType
	} from '$lib/types';
	import { slide } from 'svelte/transition';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';

	// --- State Management ---
	let displayGroups = $state<SuperCategoryGroupType[]>(
		JSON.parse(JSON.stringify($superCategoryGroups || []))
	);

	function handleSuperCategoryDrop(
		e: CustomEvent<DndEvent<SuperCategoryGroupType>>
	) {
		displayGroups = e.detail.items;
		// TODO
		// ここでAPIを呼び出して、サーバー上の順序も更新するロジックを追加する
	}

	// --- State for the inline "Add Super Category" form ---
	let isAdding = $state(false);
	let newLabel = $state('');
	let inputElement: HTMLInputElement | undefined = $state();

	function showAddForm() {
		isAdding = true;
		setTimeout(() => {
			inputElement?.focus();
		}, 0);
	}

	function cancelAdd() {
		isAdding = false;
		newLabel = '';
	}

	async function submitNewSuperCategory() {
		if (!newLabel.trim()) {
			cancelAdd();
			return;
		}
		try {
			const newOrder = $superCategoryGroups.length;
			const res = await fetch('/api/super-categories', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ label: newLabel, order: newOrder })
			});
			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || '大カテゴリの作成に失敗しました。');
			}
			const newSuperCategoryData: SuperCategory = await res.json();
			const newSuperCategoryGroup: SuperCategoryGroupType = {
				...newSuperCategoryData,
				categories: []
			};
			superCategoryGroups.update((groups) => [
				...groups,
				newSuperCategoryGroup
			]);
			cancelAdd();
		} catch (err) {
			console.error('Failed to add super category:', err);
			alert(
				err instanceof Error ? err.message : '不明なエラーが発生しました。'
			);
		}
	}
</script>

{#key $superCategoryGroups}
	<div
		class="mx-auto max-w-2xl space-y-8 px-2 py-6 sm:px-4"
		use:dndzone={{
			items: displayGroups,
			type: 'super-category'
		}}
		onfinalize={handleSuperCategoryDrop}
	>
		{#each displayGroups as superCat (superCat.id)}
			<div use:dndzone={{ items: [superCat], type: 'super-category' }}>
				<SuperCategoryGroup group={superCat} />
			</div>
		{/each}

		<section>
			{#if !isAdding}
				<div transition:slide>
					<button
						class="flex h-24 w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-400 text-slate-400 transition-colors hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500"
						onclick={showAddForm}
						title="新しい大カテゴリを追加"
					>
						<Plus class="h-12 w-12" />
					</button>
				</div>
			{:else}
				<div
					class="flex h-24 w-full items-center gap-4 rounded-xl border-2 border-emerald-500 bg-emerald-500/10 p-4"
					transition:slide
				>
					<input
						type="text"
						bind:this={inputElement}
						bind:value={newLabel}
						placeholder="新しい大カテゴリ名"
						class="h-full flex-1 bg-transparent text-xl font-semibold text-slate-700 focus:outline-none dark:text-slate-200"
						onkeydown={(e) => {
							if (e.key === 'Enter') submitNewSuperCategory();
							if (e.key === 'Escape') cancelAdd();
						}}
					/>
					<button
						class="rounded-full bg-emerald-500 p-2 text-white hover:bg-emerald-600"
						onclick={submitNewSuperCategory}
						title="追加"
					>
						<Check class="h-6 w-6" />
					</button>
					<button
						class="rounded-full bg-slate-400 p-2 text-white hover:bg-slate-500"
						onclick={cancelAdd}
						title="キャンセル"
					>
						<X class="h-6 w-6" />
					</button>
				</div>
			{/if}
		</section>
	</div>
{/key}
