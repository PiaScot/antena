<script lang="ts">
	import { userSettings, type FontSize } from '$lib/stores/userSettingsStore';

	const sizes: { label: string; value: FontSize }[] = [
		{ label: '小', value: 'small' },
		{ label: '中', value: 'medium' },
		{ label: '大', value: 'large' }
	];

	/**
	 * テーマ（ライト/ダーク）を切り替える関数
	 */
	function toggleTheme() {
		userSettings.update((settings) => ({
			...settings,
			theme: settings.theme === 'light' ? 'dark' : 'light'
		}));
	}

	/**
	 * フォントサイズを設定する関数
	 * @param size 新しいフォントサイズ
	 */
	function setFontSize(size: FontSize) {
		userSettings.update((settings) => ({
			...settings,
			fontSize: size
		}));
	}
</script>

<section class="p-4">
	<h1 class="mb-6 text-2xl font-bold text-slate-800 dark:text-slate-100">
		設定
	</h1>
	<div class="space-y-4">
		<div
			class="flex w-full items-center justify-between rounded-lg border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
		>
			<span class="text-base text-gray-900 dark:text-gray-100"
				>ダークモード</span
			>
			<label class="relative inline-flex cursor-pointer items-center">
				<input
					type="checkbox"
					class="peer sr-only"
					checked={$userSettings.theme === 'dark'}
					onchange={toggleTheme}
				/>
				<div
					class="h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-emerald-500 peer-focus:ring-2 peer-focus:ring-emerald-500 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full dark:bg-gray-600"
				></div>
			</label>
		</div>

		<div
			class="flex w-full items-center justify-between rounded-lg border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
		>
			<span class="text-base text-gray-900 dark:text-gray-100">文字サイズ</span>
			<div
				class="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-700"
				role="group"
			>
				{#each sizes as size (size.value)}
					<button
						type="button"
						class="rounded-md px-4 py-1.5 text-sm font-semibold transition-colors duration-200"
						class:bg-emerald-500={$userSettings.fontSize === size.value}
						class:text-white={$userSettings.fontSize === size.value}
						class:text-slate-700={$userSettings.fontSize !== size.value}
						class:dark:text-slate-200={$userSettings.fontSize !== size.value}
						class:hover:bg-slate-200={$userSettings.fontSize !== size.value}
						class:dark:hover:bg-slate-600={$userSettings.fontSize !==
							size.value}
						onclick={() => setFontSize(size.value)}
						aria-pressed={$userSettings.fontSize === size.value}
					>
						{size.label}
					</button>
				{/each}
			</div>
		</div>
	</div>
</section>
