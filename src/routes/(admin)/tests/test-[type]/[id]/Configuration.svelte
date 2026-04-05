<script lang="ts">
	import Settings from '@lucide/svelte/icons/settings';
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import ConfigureBox from './ConfigureBox.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import PartialMarkingSection from '$lib/components/PartialMarkingSection.svelte';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { MarksLevel, OmrMode } from './schema';
	import * as Select from '$lib/components/ui/select';
	import { resolve } from '$app/paths';

	interface CertificateToken {
		token: string;
		label: string;
	}

	let { formData } = $props();

	if (!$formData.marking_scheme) {
		$formData.marking_scheme = {
			correct: 1,
			wrong: 0,
			skipped: 0
		};
	}

	if (!$formData.marks_level) {
		$formData.marks_level = MarksLevel.QUESTION;
	}

	if (!$formData.locale) {
		$formData.locale = 'en-US';
	}

	if (!$formData.omr) {
		$formData.omr = OmrMode.NEVER;
	}

	let languageOptions = $state<{ [key: string]: string }>({});
	let certificatesOptions = $state<Array<{ id: number; name: string | null }>>([]);
	let formsOptions = $state<Array<{ id: number; name: string; description: string | null }>>([]);
	let availableTokens = $state<CertificateToken[]>([]);
	let copiedToken = $state<string | null>(null);

	async function loadLanguages() {
		try {
			const response = await fetch('/api/languages');
			if (response.ok) {
				const data = await response.json();
				languageOptions = data;
			}
		} catch (error) {
			console.error('Failed to load test languages:', error);
		}
	}

	async function loadForms() {
		try {
			const response = await fetch('/api/forms');
			if (response.ok) {
				const data = await response.json();
				formsOptions = data.items ?? [];
			}
		} catch (error) {
			console.error('Failed to load forms:', error);
			formsOptions = [];
		}
	}

	async function loadCertificates() {
		try {
			const response = await fetch('/api/certificates');
			if (response.ok) {
				const data = await response.json();
				certificatesOptions = data.items ?? [];
			}
		} catch (error) {
			console.error('Failed to load certificates:', error);
			certificatesOptions = [];
		}
	}

	async function loadCertificateTokens() {
		if (!$formData.certificate_id) {
			availableTokens = [];
			return;
		}
		try {
			const queryParams = $formData.form_id ? `?form_id=${$formData.form_id}` : '';
			const response = await fetch(`/api/certificate-tokens${queryParams}`);
			if (response.ok) {
				const data = await response.json();
				availableTokens = data.tokens ?? [];
			}
		} catch (error) {
			console.error('Failed to load certificate tokens:', error);
			availableTokens = [];
		}
	}

	async function copyToClipboard(token: string) {
		const tokenText = `{{${token}}}`;
		try {
			await navigator.clipboard.writeText(tokenText);
			copiedToken = token;
			setTimeout(() => {
				copiedToken = null;
			}, 2000);
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
		}
	}

	$effect(() => {
		loadLanguages();
		loadForms();
		loadCertificates();
	});

	$effect(() => {
		$formData.certificate_id;
		$formData.form_id;
		loadCertificateTokens();
	});
</script>

{#snippet label(label: string)}
	<Label class="mb-2 block text-sm font-semibold text-gray-800">{label}</Label>
{/snippet}

{#snippet selectTrigger(text: string, isSelected: boolean)}
	<Select.Trigger class="w-full rounded-full border-gray-300">
		<span
			class={['truncate', isSelected ? 'font-normal text-gray-800' : 'font-light text-gray-500']}
		>
			{text}
		</span>
	</Select.Trigger>
{/snippet}
<div class="flex flex-col gap-4 p-6">
	<!-- 1. Candidate Experience -->
	<ConfigureBox title="Candidate Experience" Icon={Settings} defaultOpen={true}>
		<div class="grid grid-cols-1 gap-6 py-4 md:grid-cols-2 md:gap-12 md:py-6">
			<!-- Left: textareas -->
			<div class="flex flex-col gap-6">
				<div>
					{@render label('Pre-test Guidelines')}
					<Textarea
						name="start_instructions"
						placeholder="E.g., Ensure stable internet. Read each question carefully..."
						class="min-h-25 border-gray-300 placeholder:font-light placeholder:text-gray-500"
						bind:value={$formData.start_instructions}
					/>
				</div>
				<div>
					{@render label('Test Completion Message')}
					<Textarea
						name="completion_message"
						placeholder="E.g., Thank you for completing the assessment. Your results will be shared soon."
						class="min-h-25 border-gray-300 placeholder:font-light placeholder:text-gray-500"
					/>
				</div>
			</div>

			<!-- Right: selects -->
			<div class="flex flex-col gap-6">
				<div>
					{@render label('Language')}
					<Select.Root type="single" name="locale" bind:value={$formData.locale}>
						{@render selectTrigger(
							languageOptions[$formData.locale] || 'Select Language',
							!!$formData.locale
						)}
						<Select.Content>
							<Select.Group>
								{#each Object.entries(languageOptions) as [key, label] (key)}
									<Select.Item value={key} {label}>{label}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>

				<div>
					{@render label('Candidate Information Form')}
					<div class="flex items-center gap-2">
						<Select.Root type="single" name="form_id" bind:value={$formData.form_id}>
							{@render selectTrigger(
								formsOptions.find((f) => f.id === $formData.form_id)?.name || 'Select Form',
								!!$formData.form_id
							)}
							<Select.Content>
								<Select.Group>
									<Select.Item value="" label="No form">No form</Select.Item>
									{#each formsOptions as form (form.id)}
										<Select.Item value={String(form.id)}>{form.name}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<div>
					{@render label('Certificate')}
					<Select.Root type="single" name="certificate_id" bind:value={$formData.certificate_id}>
						{@render selectTrigger(
							certificatesOptions.find((c) => c.id === $formData.certificate_id)?.name ||
								'Select Certificate',
							!!$formData.certificate_id
						)}
						<Select.Content>
							<Select.Group>
								<Select.Item value="" label="No certificate">No certificate</Select.Item>
								{#each certificatesOptions as cert (cert.id)}
									<Select.Item value={String(cert.id)}>{cert.name}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>

					{#if $formData.certificate_id && availableTokens.length > 0}
						<div class="bg-muted/50 mt-3 rounded-md border p-3">
							<p class="mb-2 text-xs font-medium">Available Tokens</p>
							<div class="flex flex-wrap gap-2">
								{#each availableTokens as token (token.token)}
									<button
										type="button"
										class="bg-background hover:bg-accent flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors"
										onclick={() => copyToClipboard(token.token)}
										title={token.label}
									>
										<code class="text-primary">{`{{${token.token}}}`}</code>
										{#if copiedToken === token.token}
											<Check class="h-3 w-3 text-green-500" />
										{:else}
											<Copy class="text-muted-foreground h-3 w-3" />
										{/if}
									</button>
								{/each}
							</div>
							<p class="text-muted-foreground mt-2 text-xs">
								Click to copy. Use these tokens in your Google Slides certificate template.
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</ConfigureBox>

	<!-- 2. Test Rules -->
	<ConfigureBox title="Test Rules" Icon={Settings}>
		<div class="flex flex-col gap-6 py-4 md:py-6">
			<div class="flex items-center justify-between">
				<Label class="text-sm font-medium text-gray-700">Maximum time limit for the test</Label>
				<Input
					placeholder="0 minutes"
					class="w-36 rounded-lg text-center placeholder:font-light placeholder:text-gray-500"
					type="number"
					name="time_limit"
					bind:value={$formData.time_limit}
				/>
			</div>

			<div class="flex items-center justify-between">
				<Label class="text-sm font-medium text-gray-700">Shuffle question order per candidate</Label
				>
				<div class="bg-muted flex rounded-xl p-1">
					<button
						type="button"
						class={[
							'rounded-xl px-4 py-1.5 text-sm transition-colors',
							$formData.shuffle
								? 'bg-background text-primary font-semibold shadow'
								: 'text-gray-500'
						]}
						onclick={() => {
							$formData.shuffle = true;
							$formData.random_questions = false;
							$formData.no_of_random_questions = 0;
						}}
					>
						Yes
					</button>
					<button
						type="button"
						class={[
							'rounded-xl px-4 py-1.5 text-sm transition-colors',
							!$formData.shuffle
								? 'bg-background text-primary font-semibold shadow'
								: 'text-gray-500'
						]}
						onclick={() => ($formData.shuffle = false)}
					>
						No
					</button>
				</div>
			</div>

			{#if $formData.random_tag_count.length === 0}
				<div class="flex items-center justify-between">
					<Label class="w-1/2 text-sm font-medium text-gray-700"
						>Select random questions per candidate</Label
					>
					<Input
						placeholder="0 questions"
						class="w-36 rounded-lg text-center placeholder:font-light placeholder:text-gray-500 "
						type="number"
						name="no_of_random_questions"
						bind:value={$formData.no_of_random_questions}
					/>
				</div>
				{#if $formData.no_of_random_questions > 0 && $formData.question_revision_ids.length < $formData.no_of_random_questions}
					<small class="text-red-400">
						Number of random questions cannot exceed the total number of questions selected.
					</small>
				{/if}
			{/if}
		</div>
	</ConfigureBox>

	<!-- 3. Marking Scheme -->
	<ConfigureBox title="Marking Scheme" Icon={Settings}>
		<div class="flex flex-col gap-4 py-4 md:py-6">
			<RadioGroup.Root bind:value={$formData.marks_level} class="flex flex-col gap-3">
				<label
					for="question_level"
					class={[
						'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
						$formData.marks_level === MarksLevel.QUESTION
							? 'border-primary bg-primary/5'
							: 'hover:bg-gray-50'
					]}
				>
					<RadioGroup.Item value={MarksLevel.QUESTION} id="question_level" class="mt-0.5" />
					<div>
						<p class="text-sm font-semibold text-gray-800">Question Level Marking</p>
						<p class="text-sm text-gray-500">
							Each question has its own marks defined individually in the question bank
						</p>
					</div>
				</label>

				<label
					for="test_level"
					class={[
						'flex cursor-pointer flex-col rounded-xl border p-4 transition-colors',
						$formData.marks_level === MarksLevel.TEST
							? 'border-primary bg-primary/5'
							: 'hover:bg-gray-50'
					]}
				>
					<div class="flex items-start gap-3">
						<RadioGroup.Item value={MarksLevel.TEST} id="test_level" class="mt-0.5" />
						<div>
							<p class="text-sm font-semibold text-gray-800">Test Level Marking</p>
							<p class="text-sm text-gray-500">
								Apply uniform marks across all questions in this test
							</p>
						</div>
					</div>

					{#if $formData.marks_level === MarksLevel.TEST}
						<div class="mt-4 ml-7 flex flex-col gap-4">
							<div class="grid grid-cols-3 gap-3">
								<div class="flex flex-col gap-1">
									<small class="text-gray-500">Correct</small>
									<Input
										class="w-full bg-white"
										type="number"
										placeholder="0"
										name="marking_scheme.correct"
										bind:value={$formData.marking_scheme.correct}
									/>
								</div>
								<div class="flex flex-col gap-1">
									<small class="text-gray-500">Incorrect</small>
									<Input
										class="w-full bg-white"
										type="number"
										placeholder="0"
										name="marking_scheme.wrong"
										bind:value={$formData.marking_scheme.wrong}
									/>
								</div>
								<div class="flex flex-col gap-1">
									<small class="text-gray-500">No answer</small>
									<Input
										class="w-full bg-white"
										type="number"
										placeholder="0"
										name="marking_scheme.skipped"
										bind:value={$formData.marking_scheme.skipped}
									/>
								</div>
							</div>
							<PartialMarkingSection bind:partial={$formData.marking_scheme.partial} />
						</div>
					{/if}
				</label>
			</RadioGroup.Root>
		</div>
	</ConfigureBox>
</div>
