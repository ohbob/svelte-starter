<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "$lib/utils/toast";
	import { Button, FormField, FormTextarea, Card, LoadingSpinner } from "$lib/components/ui";
	import { LANGUAGES } from "$lib/utils/form";

	let loading = $state(true);
	let saving = $state(false);

	// Team Members form data
	let teamMembers = $state([
		{
			name: "",
			title: "",
			photo_url: "",
			bio_short: "",
			credentials: [],
			languages_spoken: ["English"],
		},
	]);

	onMount(async () => {
		await loadTeamMembers();
	});

	async function loadTeamMembers() {
		loading = true;
		try {
			const response = await fetch("/api/company/team");
			if (response.ok) {
				const data = await response.json();
				if (data.teamMembers && data.teamMembers.length > 0) {
					teamMembers = data.teamMembers;
				}
			}
		} catch (error) {
			console.error("Error loading team members:", error);
			toast.error("Failed to load team members");
		} finally {
			loading = false;
		}
	}

	async function saveTeamMembers() {
		saving = true;
		try {
			const response = await fetch("/api/company/team", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ teamMembers }),
			});

			if (response.ok) {
				toast.success("Team members saved successfully!");
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to save team members");
			}
		} catch (error) {
			console.error("Error saving team members:", error);
			toast.error("Failed to save team members");
		} finally {
			saving = false;
		}
	}

	function handleSubmit(event) {
		event.preventDefault();
		saveTeamMembers();
	}

	function addTeamMember() {
		teamMembers = [
			...teamMembers,
			{
				name: "",
				title: "",
				photo_url: "",
				bio_short: "",
				credentials: [],
				languages_spoken: ["English"],
			},
		];
	}

	function removeTeamMember(index) {
		teamMembers = teamMembers.filter((_, i) => i !== index);
	}

	function handleRemoveTeamMember(index) {
		return () => removeTeamMember(index);
	}
</script>

<div>
	{#if loading}
		<LoadingSpinner />
	{:else}
		<form onsubmit={handleSubmit} class="form-section">
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900">Team Members</h2>
				<Button type="button" onclick={addTeamMember} variant="outline">
					{#snippet children()}Add Team Member{/snippet}
				</Button>
			</div>

			{#each teamMembers as member, index}
				<Card title="Team Member {index + 1}">
					{#snippet children()}
						<div class="form-group">
							<div class="mb-4 flex items-start justify-between">
								<div class="form-row flex-1">
									<FormField label="Name" bind:value={member.name} placeholder="Full name" />
									<FormField
										label="Title"
										bind:value={member.title}
										placeholder="Job title or role"
									/>
								</div>
								{#if teamMembers.length > 1}
									<button
										type="button"
										onclick={handleRemoveTeamMember(index)}
										variant="ghost"
										class="ml-4 rounded px-3 py-1 text-red-600 hover:text-red-800"
									>
										Remove
									</button>
								{/if}
							</div>

							<FormField
								label="Photo URL"
								type="url"
								bind:value={member.photo_url}
								placeholder="https://example.com/photo.jpg"
							/>

							<FormTextarea
								label="Bio"
								bind:value={member.bio_short}
								placeholder="Brief professional bio"
								rows={3}
							/>

							<div>
								<label class="label-base">Languages Spoken</label>
								<select multiple bind:value={member.languages_spoken} class="input-base h-24">
									{#each LANGUAGES.slice(0, 8) as language}
										<option value={language}>{language}</option>
									{/each}
								</select>
							</div>
						</div>
					{/snippet}
				</Card>
			{/each}

			<!-- Save Button -->
			<div class="mt-8 flex justify-end border-t pt-6">
				<button type="submit" disabled={saving} class="button-primary">
					{saving ? "Saving..." : "Save Team Members"}
				</button>
			</div>
		</form>
	{/if}
</div>
