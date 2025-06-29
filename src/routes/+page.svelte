<script lang="ts">
import { superCategoryGroups } from "$lib/stores/categoryStore";
import SuperCategoryGroup from "$lib/components/SuperCategoryGroup.svelte";
import type { SuperCategoryGroup as SuperCategoryGroupType } from "$lib/types";
</script>

<div class="mx-auto max-w-2xl space-y-8 px-2 py-6 sm:px-4">
	{#each $superCategoryGroups as superCat (superCat.id)}
		<div>
			<SuperCategoryGroup group={superCat} />
		</div>
	{/each}
</div>
