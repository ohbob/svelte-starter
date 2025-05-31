<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import { showSuccess, showError, toastMessages } from "$lib/utils/toast";

	let { data, form } = $props();

	let customUrl = $state(data.user?.customUrl || "");
	let contactEmail = $state(data.user?.contactEmail || "");
	let isLoading = $state(false);

	const handleSubmit = () => {
		isLoading = true;
	};

	// Show toast notifications based on form results
	$effect(() => {
		if (form?.success) {
			showSuccess(toastMessages.profileUpdated);
		} else if (form?.error) {
			showError(form.error);
		}
	});

	// Reset loading state after form submission
	$effect(() => {
		if (form) {
			isLoading = false;
		}
	});
</script>

<div class="p-6">
	<!-- Profile Settings -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Portfolio Settings -->
		<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
			<div class="border-b border-gray-200 px-6 py-4">
				<h2 class="text-lg font-semibold text-gray-900">Portfolio Settings</h2>
			</div>
			<div class="p-6">
				<form
					method="POST"
					action="?/updateProfile"
					use:enhance={() => {
						handleSubmit();
						return async ({ update }) => {
							await update();
						};
					}}
					class="space-y-4"
				>
					<div>
						<label for="custom-url" class="mb-2 block text-sm font-medium text-gray-700"
							>Custom URL *</label
						>
						<div class="flex items-center gap-2">
							<span class="text-sm text-gray-500">yoursite.com/u/</span>
							<input
								id="custom-url"
								name="customUrl"
								bind:value={customUrl}
								type="text"
								placeholder="your-name"
								class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
								pattern="[a-zA-Z0-9_\-]+"
								minlength="3"
								maxlength="30"
							/>
						</div>
						<p class="mt-1 text-xs text-gray-500">
							3-30 characters. Letters, numbers, hyphens, and underscores only.
						</p>
					</div>

					<div>
						<label for="contact-email" class="mb-2 block text-sm font-medium text-gray-700"
							>Contact Email</label
						>
						<input
							id="contact-email"
							name="contactEmail"
							bind:value={contactEmail}
							type="email"
							placeholder="contact@example.com"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<p class="mt-1 text-xs text-gray-500">
							This email will be used for contact forms on your portfolio. Leave empty to use your
							account email.
						</p>
					</div>

					<div class="pt-4">
						<Button type="submit" disabled={isLoading}>
							{isLoading ? "Saving..." : "Save Settings"}
						</Button>
						{#if data.user?.customUrl}
							<Button href="/u/{data.user.customUrl}" variant="outline" class="ml-3">
								View My Site
							</Button>
						{/if}
					</div>
				</form>
			</div>
		</div>

		<!-- Account Information -->
		<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
			<div class="border-b border-gray-200 px-6 py-4">
				<h2 class="text-lg font-semibold text-gray-900">Account Information</h2>
			</div>
			<div class="space-y-4 p-6">
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-500">Name</label>
					<p class="text-sm text-gray-900">{data.user?.name || "Not set"}</p>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-500">Account Email</label>
					<p class="text-sm text-gray-900">{data.user?.email}</p>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-500">Member Since</label>
					<p class="text-sm text-gray-900">{new Date(data.user?.createdAt).toLocaleDateString()}</p>
				</div>
				{#if data.user?.customUrl}
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-500">Portfolio URL</label>
						<p class="text-sm text-gray-900">
							<a
								href="/u/{data.user.customUrl}"
								target="_blank"
								class="text-blue-600 hover:text-blue-800"
							>
								yoursite.com/u/{data.user.customUrl}
							</a>
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
