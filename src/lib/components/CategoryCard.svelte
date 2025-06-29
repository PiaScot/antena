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
let inputElement: HTMLInputElement | undefined = $state();

// --- Functions ---

function startEditing(event?: MouseEvent | KeyboardEvent) {
	if (!$isLayoutEditMode) return;
	event?.preventDefault();

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
		editingLabel = cat.label;
		return;
	}
	try {
		const res = await fetch("/api/category", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				originalId: cat.id,
				id: cat.id,
				label: editingLabel.trim(),
			}),
		});
		if (!res.ok) {
			const errorData = await res.json();
			throw new Error(errorData.error || "Failed to update category label");
		}
		const updatedCategory: Category = await res.json();
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
		editingLabel = cat.label;
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
	<div
		class="relative flex h-16 items-center rounded-xl bg-white p-2 text-slate-800 shadow-md dark:bg-slate-600 dark:text-slate-100 md:h-20"
		class:cursor-grab={!isEditing}
		use:dndzone={{
			items: [cat],
			type: 'category'
		}}
	>
		<span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300">
			<GripVertical class="h-5 w-5" />
		</span>

		<div class="flex-1 px-8 text-center">
			{#if isEditing}
				<input
					type="text"
					bind:this={inputElement}
					bind:value={editingLabel}
					class="w-full rounded bg-slate-100 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700"
					onblur={handleUpdate}
					onkeydown={(e) => e.key === 'Enter' && handleUpdate()}
				/>
			{:else}
				<span
					class="text-lg font-semibold"
					onclick={startEditing}
					onkeydown={(e) => e.key === 'Enter' && startEditing(e)}
					role="button"
					tabindex="0"
				>
					{cat.label}
				</span>
			{/if}
		</div>

		<button
			class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-red-500 dark:text-slate-300"
			title="このカテゴリを削除"
			onclick={handleDelete}
		>
			<Trash2 class="h-4 w-4" />
		</button>
	</div>
{:else}
	<a
		href={'/feed?category=' + cat.id}
		class="flex h-16 items-center justify-center rounded-xl bg-slate-100 p-2 text-center text-xl font-semibold text-emerald-700 shadow transition-colors hover:bg-emerald-50 dark:bg-slate-700 dark:text-emerald-300 dark:hover:bg-emerald-800 md:h-20"
	>
		{cat.label}
	</a>
{/if}
