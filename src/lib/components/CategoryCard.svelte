<script lang="ts">
import type { Category } from "$lib/types";
import { isLayoutEditMode } from "$lib/stores/uiStore";
import { dndzone } from "svelte-dnd-action";
import { GripVertical, Trash2 } from "@lucide/svelte";
import {
	categories as categoriesStore,
	superCategoryGroups,
} from "$lib/stores/categoryStore";

const { cat } = $props<{ cat: Category }>();

let isEditing = $state(false);
let editingLabel = $state(cat.label);
let inputElement = $state<HTMLInputElement>();

function startEditing() {
	if (!$isLayoutEditMode) return;
	isEditing = true;
	editingLabel = cat.label;
	setTimeout(() => {
		inputElement?.focus();
		inputElement?.select();
	}, 0);
}

async function handleUpdate() {
	if (!isEditing || !editingLabel.trim() || editingLabel.trim() === cat.label) {
		isEditing = false;
		editingLabel = cat.label; // Revert if empty or unchanged
		return;
	}

	try {
		// Use the existing PATCH API for categories
		const res = await fetch("/api/category", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				originalId: cat.id,
				id: cat.id, // ID is not changing here
				label: editingLabel.trim(),
			}),
		});

		if (!res.ok) {
			const errorData = await res.json();
			throw new Error(errorData.error || "Failed to update category label");
		}

		const updatedCategory: Category = await res.json();

		// Update all relevant stores
		categoriesStore.update((cats) =>
			cats.map((c) => (c.id === cat.id ? updatedCategory : c)),
		);
		superCategoryGroups.update((groups) =>
			groups.map((g) => ({
				...g,
				categories: g.categories.map((c) =>
					c.id === cat.id ? updatedCategory : c,
				),
			})),
		);
	} catch (err) {
		console.error("Category label update failed:", err);
		alert(`カテゴリの更新に失敗しました:\n${(err as Error).message}`);
		editingLabel = cat.label; // Revert on failure
	} finally {
		isEditing = false;
	}
}

async function handleDelete() {
	if (!confirm(`カテゴリ「${cat.label}」を削除しますか？`)) return;

	try {
		const res = await fetch(`/api/category?id=${cat.id}`, { method: "DELETE" });
		if (res.status !== 204 && !res.ok) {
			const errorData = await res.json();
			throw new Error(errorData.error || "Failed to delete category");
		}

		// Update all relevant stores
		categoriesStore.update((cats) => cats.filter((c) => c.id !== cat.id));
		superCategoryGroups.update((groups) =>
			groups.map((g) => ({
				...g,
				categories: g.categories.filter((c) => c.id !== cat.id),
			})),
		);
	} catch (err) {
		console.error("Category deletion failed:", err);
		alert(`カテゴリの削除に失敗しました:\n${(err as Error).message}`);
	}
}
</script>

{#if $isLayoutEditMode}
	<!-- Edit Mode Display -->
	<div
		class="relative flex items-center h-16 md:h-20 p-2 rounded-xl shadow-md bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 cursor-grab"
		use:dndzone={{ items: [cat], id: cat.id, type: 'category' }}
	>
		<!-- Drag Handle -->
		<span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300">
			<GripVertical class="w-5 h-5" />
		</span>

		<!-- Editable Label -->
		<div class="flex-1 text-center px-8">
			{#if isEditing}
				<input
					type="text"
					bind:this={inputElement}
					bind:value={editingLabel}
					class="w-full bg-slate-100 dark:bg-slate-700 text-lg font-semibold text-center rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
					onblur={handleUpdate}
					onkeydown={(e) => e.key === 'Enter' && handleUpdate()}
				/>
			{:else}
				<span
					class="text-lg font-semibold"
					onclick={startEditing}
					onkeydown={(e) => e.key === 'Enter' && startEditing()}
					role="button"
					tabindex="0"
				>
					{cat.label}
				</span>
			{/if}
		</div>

		<!-- Delete Button -->
		<button
			class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 dark:text-slate-300 hover:text-red-500 rounded-full"
			title="このカテゴリを削除"
			onclick={handleDelete}
		>
			<Trash2 class="w-4 h-4" />
		</button>
	</div>
{:else}
	<!-- View Mode Display -->
	<a
		href={"/feed?category=" + cat.id}
		class="flex items-center justify-center h-16 md:h-20 p-2 rounded-xl shadow bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-800 text-xl font-semibold text-emerald-700 dark:text-emerald-300 transition-colors text-center"
	>
		{cat.label}
	</a>
{/if}
