<script lang="ts">
import { superCategoryGroups } from "$lib/stores/categoryStore";
import SuperCategoryGroup from "$lib/components/SuperCategoryGroup.svelte";
import { isLayoutEditMode } from "$lib/stores/uiStore";
import { Plus, Check, X } from "@lucide/svelte";
import type {
	SuperCategory,
	SuperCategoryGroup as SuperCategoryGroupType,
} from "$lib/types";
import { slide } from "svelte/transition";

const displayGroups = $derived(
	($superCategoryGroups || [])
		.map((group) => ({
			...group,
			categories: group.categories.filter((cat) => cat.visible),
		}))
		.filter((group) => $isLayoutEditMode || group.categories.length > 0),
);

// --- State for the inline "Add Super Category" form ---
let isAdding = $state(false);
let newLabel = $state("");
let inputElement = $state<HTMLInputElement>();

function showAddForm() {
	isAdding = true;
	setTimeout(() => {
		inputElement?.focus();
	}, 0);
}

function cancelAdd() {
	isAdding = false;
	newLabel = "";
}

/**
 * 新しい大カテゴリを送信する
 */
async function submitNewSuperCategory() {
	if (!newLabel.trim()) {
		cancelAdd();
		return;
	}

	try {
		const newOrder = $superCategoryGroups.length;

		const res = await fetch("/api/super-categories", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ label: newLabel, order: newOrder }),
		});

		if (!res.ok) {
			const errorData = await res.json();
			throw new Error(errorData.error || "大カテゴリの作成に失敗しました。");
		}

		const newSuperCategoryData: SuperCategory = await res.json();

		const newSuperCategoryGroup: SuperCategoryGroupType = {
			...newSuperCategoryData,
			categories: [],
		};

		superCategoryGroups.update((groups) => [...groups, newSuperCategoryGroup]);

		// Reset the form
		cancelAdd();
	} catch (err) {
		console.error("Failed to add super category:", err);
		alert(err instanceof Error ? err.message : "不明なエラーが発生しました。");
	}
}
</script>

<div class="max-w-2xl mx-auto px-2 sm:px-4 py-6 space-y-8">
	<!-- Loop through existing super category groups -->
	{#each displayGroups as superCat (superCat.id)}
		<SuperCategoryGroup group={superCat} />
	{/each}

	<!-- "Add Super Category" placeholder / form -->
	{#if $isLayoutEditMode}
		<section>
			{#if !isAdding}
				<!-- The "Add" button placeholder -->
				<div transition:slide>
					<button
						class="w-full h-24 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-400 hover:border-emerald-500 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 transition-colors"
						onclick={showAddForm}
						title="新しい大カテゴリを追加"
					>
						<Plus class="w-12 h-12" />
					</button>
				</div>
			{:else}
				<!-- The inline input form -->
				<div 
					class="w-full h-24 p-4 flex items-center gap-4 rounded-xl border-2 border-emerald-500 bg-emerald-500/10"
					transition:slide
				>
					<input
						type="text"
						bind:this={inputElement}
						bind:value={newLabel}
						placeholder="新しい大カテゴリ名"
						class="flex-1 h-full text-xl font-semibold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none"
						onkeydown={(e) => {
							if (e.key === 'Enter') submitNewSuperCategory();
							if (e.key === 'Escape') cancelAdd();
						}}
					/>
					<button 
						class="p-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
						onclick={submitNewSuperCategory}
						title="追加"
					>
						<Check class="w-6 h-6" />
					</button>
					<button 
						class="p-2 rounded-full bg-slate-400 text-white hover:bg-slate-500"
						onclick={cancelAdd}
						title="キャンセル"
					>
						<X class="w-6 h-6" />
					</button>
				</div>
			{/if}
		</section>
	{/if}
</div>
