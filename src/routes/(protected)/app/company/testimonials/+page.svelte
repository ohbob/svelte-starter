<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "$lib/utils/toast";
	import { FormField, FormTextarea, Card, LoadingSpinner } from "$lib/components/ui";

	let loading = $state(true);
	let saving = $state(false);

	// Testimonials form data
	let testimonials = $state([
		{
			client_name: "",
			client_title: "",
			client_company: "",
			testimonial_text: "",
			rating: 5,
			photo_url: "",
			date_received: "",
			featured: false,
		},
	]);

	onMount(async () => {
		await loadTestimonials();
	});

	async function loadTestimonials() {
		loading = true;
		try {
			const response = await fetch("/api/company/testimonials");
			if (response.ok) {
				const data = await response.json();
				if (data.testimonials && data.testimonials.length > 0) {
					testimonials = data.testimonials;
				}
			}
		} catch (error) {
			console.error("Error loading testimonials:", error);
			toast.error("Failed to load testimonials");
		} finally {
			loading = false;
		}
	}

	async function saveTestimonials() {
		saving = true;
		try {
			const response = await fetch("/api/company/testimonials", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ testimonials }),
			});

			if (response.ok) {
				toast.success("Testimonials saved successfully!");
			} else {
				const error = await response.json();
				toast.error(error.error || "Failed to save testimonials");
			}
		} catch (error) {
			console.error("Error saving testimonials:", error);
			toast.error("Failed to save testimonials");
		} finally {
			saving = false;
		}
	}

	function handleSubmit(event) {
		event.preventDefault();
		saveTestimonials();
	}

	function addTestimonial() {
		testimonials = [
			...testimonials,
			{
				client_name: "",
				client_title: "",
				client_company: "",
				testimonial_text: "",
				rating: 5,
				photo_url: "",
				date_received: "",
				featured: false,
			},
		];
	}

	function removeTestimonial(index) {
		testimonials = testimonials.filter((_, i) => i !== index);
	}

	function handleRemoveTestimonial(index) {
		return () => removeTestimonial(index);
	}
</script>

<div>
	{#if loading}
		<LoadingSpinner />
	{:else}
		<form onsubmit={handleSubmit} class="form-section">
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900">Client Testimonials</h2>
				<button type="button" onclick={addTestimonial} class="button-secondary">
					Add Testimonial
				</button>
			</div>

			{#each testimonials as testimonial, index}
				<Card title={testimonial.client_name || `Testimonial ${index + 1}`}>
					{#snippet children()}
						<div class="form-group">
							<div class="mb-4 flex items-start justify-between">
								<div class="form-row flex-1">
									<FormField
										label="Client Name"
										bind:value={testimonial.client_name}
										placeholder="John Doe"
									/>
									<FormField
										label="Client Title"
										bind:value={testimonial.client_title}
										placeholder="CEO, Manager, etc."
									/>
								</div>
								{#if testimonials.length > 1}
									<button
										type="button"
										onclick={handleRemoveTestimonial(index)}
										class="ml-4 rounded px-3 py-1 text-red-600 hover:text-red-800"
									>
										Remove
									</button>
								{/if}
							</div>

							<div class="form-row">
								<FormField
									label="Company"
									bind:value={testimonial.client_company}
									placeholder="Company name (optional)"
								/>
								<FormField
									label="Date Received"
									type="date"
									bind:value={testimonial.date_received}
								/>
							</div>

							<FormTextarea
								label="Testimonial"
								bind:value={testimonial.testimonial_text}
								placeholder="What did the client say about your service?"
								rows={4}
							/>

							<div class="form-row">
								<div>
									<label class="label-base">Rating</label>
									<select bind:value={testimonial.rating} class="input-base">
										<option value={5}>5 Stars</option>
										<option value={4}>4 Stars</option>
										<option value={3}>3 Stars</option>
										<option value={2}>2 Stars</option>
										<option value={1}>1 Star</option>
									</select>
								</div>
								<FormField
									label="Client Photo URL"
									type="url"
									bind:value={testimonial.photo_url}
									placeholder="https://example.com/photo.jpg"
								/>
							</div>

							<div class="flex items-center">
								<input
									type="checkbox"
									bind:checked={testimonial.featured}
									class="mr-2 rounded border-gray-300"
								/>
								<label class="text-sm text-gray-700">Feature this testimonial prominently</label>
							</div>
						</div>
					{/snippet}
				</Card>
			{/each}

			<!-- Save Button -->
			<div class="mt-8 flex justify-end border-t pt-6">
				<button type="submit" disabled={saving} class="button-primary">
					{saving ? "Saving..." : "Save Testimonials"}
				</button>
			</div>
		</form>
	{/if}
</div>
