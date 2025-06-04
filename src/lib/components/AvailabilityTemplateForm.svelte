<script>
	import { enhance } from "$app/forms";
	import { goto } from "$app/navigation";

	let { template = null, isEdit = false, action = isEdit ? "?/update" : "?/create" } = $props();

	// Form state
	let name = $state(template?.name || "");
	let description = $state(template?.description || "");
	let isDefault = $state(template?.isDefault || false);

	// UI state
	let loading = $state(false);
	let showDeleteModal = $state(false);

	// Days of the week mapping
	const daysOfWeek = [
		{ key: "monday", label: "Monday", dayOfWeek: 1 },
		{ key: "tuesday", label: "Tuesday", dayOfWeek: 2 },
		{ key: "wednesday", label: "Wednesday", dayOfWeek: 3 },
		{ key: "thursday", label: "Thursday", dayOfWeek: 4 },
		{ key: "friday", label: "Friday", dayOfWeek: 5 },
		{ key: "saturday", label: "Saturday", dayOfWeek: 6 },
		{ key: "sunday", label: "Sunday", dayOfWeek: 0 },
	];

	// Convert database slots to component format
	function convertSlotsToComponentFormat(dbSlots) {
		if (!dbSlots || dbSlots.length === 0) {
			return daysOfWeek.map((day) => ({
				day: day.key,
				enabled: ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(day.key),
				startTime: "09:00",
				endTime: "17:00",
			}));
		}

		return daysOfWeek.map((day) => {
			const dbSlot = dbSlots.find((slot) => slot.dayOfWeek === day.dayOfWeek);
			return {
				day: day.key,
				enabled: !!dbSlot,
				startTime: dbSlot?.startTime || "09:00",
				endTime: dbSlot?.endTime || "17:00",
			};
		});
	}

	// Convert component slots to database format
	function convertSlotsToDbFormat(componentSlots) {
		return componentSlots
			.filter((slot) => slot.enabled)
			.map((slot) => {
				const dayInfo = daysOfWeek.find((d) => d.key === slot.day);
				return {
					dayOfWeek: dayInfo.dayOfWeek,
					startTime: slot.startTime,
					endTime: slot.endTime,
				};
			});
	}

	// Time slots state - convert from database format
	let timeSlots = $state(convertSlotsToComponentFormat(template?.slots));

	function toggleDay(dayKey) {
		const slot = timeSlots.find((s) => s.day === dayKey);
		if (slot) {
			slot.enabled = !slot.enabled;
		}
	}

	function updateTimeSlot(dayKey, field, value) {
		const slot = timeSlots.find((s) => s.day === dayKey);
		if (slot) {
			slot[field] = value;
		}
	}

	const handleSubmit = () => {
		loading = true;
		return async ({ result, update }) => {
			if (result.type === "redirect") {
				goto(result.location);
			} else {
				await update();
			}
			loading = false;
		};
	};

	const handleDelete = () => {
		loading = true;
		return async ({ result, update }) => {
			if (result.type === "redirect") {
				goto(result.location);
			} else {
				await update();
			}
			loading = false;
			showDeleteModal = false;
		};
	};
</script>

<div class="mx-auto max-w-6xl p-6">
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold text-gray-900">
			{isEdit ? "Edit Availability Template" : "Create Availability Template"}
		</h1>
		<p class="text-gray-600">
			{isEdit
				? "Update your availability template settings"
				: "Set up when you're available for meetings"}
		</p>
	</div>

	<form
		method="POST"
		{action}
		use:enhance={handleSubmit}
		class="grid grid-cols-1 gap-8 lg:grid-cols-2"
	>
		<!-- Left Column: Basic Information -->
		<div class="space-y-6">
			<div class="rounded-lg border border-gray-200 bg-white p-6">
				<h2 class="mb-4 text-xl font-semibold text-gray-900">Basic Information</h2>

				<div class="space-y-4">
					<div>
						<label for="name" class="mb-1 block text-sm font-medium text-gray-700">
							Template Name *
						</label>
						<input
							type="text"
							id="name"
							name="name"
							bind:value={name}
							required
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="e.g., Standard Business Hours"
						/>
					</div>

					<div>
						<label for="description" class="mb-1 block text-sm font-medium text-gray-700">
							Description
						</label>
						<textarea
							id="description"
							name="description"
							bind:value={description}
							rows="3"
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Optional description for this template"
						></textarea>
					</div>

					<div class="flex items-center">
						<input
							type="checkbox"
							id="isDefault"
							name="isDefault"
							bind:checked={isDefault}
							class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<label for="isDefault" class="ml-2 block text-sm text-gray-700">
							Set as default template
						</label>
					</div>
				</div>
			</div>
		</div>

		<!-- Right Column: Time Slots -->
		<div class="space-y-6">
			<div class="rounded-lg border border-gray-200 bg-white p-6">
				<h2 class="mb-4 text-xl font-semibold text-gray-900">Available Hours</h2>

				<div class="space-y-2">
					{#each daysOfWeek as day}
						{@const slot = timeSlots.find((s) => s.day === day.key)}
						<div class="flex min-h-[50px] items-center gap-4 rounded-lg p-2">
							<div class="flex min-w-[100px] items-center">
								<input
									type="checkbox"
									id="day-{day.key}"
									checked={slot?.enabled || false}
									onchange={() => toggleDay(day.key)}
									class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
								/>
								<label for="day-{day.key}" class="ml-2 text-sm font-medium text-gray-700">
									{day.label}
								</label>
							</div>

							{#if slot?.enabled}
								<div class="flex flex-1 items-center gap-2">
									<input
										type="time"
										value={slot.startTime}
										onchange={(e) => updateTimeSlot(day.key, "startTime", e.target.value)}
										class="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
									/>
									<span class="text-sm text-gray-500">to</span>
									<input
										type="time"
										value={slot.endTime}
										onchange={(e) => updateTimeSlot(day.key, "endTime", e.target.value)}
										class="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
									/>
								</div>
							{:else}
								<div class="flex-1 text-sm text-gray-500">Unavailable</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Hidden input for slots data - convert to database format -->
		<input type="hidden" name="slots" value={JSON.stringify(convertSlotsToDbFormat(timeSlots))} />

		<!-- Action Buttons -->
		<div class="flex items-center justify-between border-t border-gray-200 pt-6 lg:col-span-2">
			<div>
				{#if isEdit}
					<button
						type="button"
						onclick={() => (showDeleteModal = true)}
						class="px-4 py-2 font-medium text-red-600 hover:text-red-800"
					>
						Delete Template
					</button>
				{/if}
			</div>

			<div class="flex items-center gap-3">
				<a
					href="/app/calendar/availability"
					class="px-4 py-2 font-medium text-gray-700 hover:text-gray-900"
				>
					Cancel
				</a>
				<button
					type="submit"
					disabled={loading}
					class="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{loading ? "Saving..." : isEdit ? "Update Template" : "Create Template"}
				</button>
			</div>
		</div>
	</form>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="mx-4 w-full max-w-md rounded-lg bg-white p-6">
			<h3 class="mb-2 text-lg font-semibold text-gray-900">Delete Template</h3>
			<p class="mb-6 text-gray-600">
				Are you sure you want to delete this availability template? This action cannot be undone.
			</p>
			<div class="flex items-center justify-end gap-3">
				<button
					type="button"
					onclick={() => (showDeleteModal = false)}
					class="px-4 py-2 text-gray-700 hover:text-gray-900"
				>
					Cancel
				</button>
				<form method="POST" action="?/delete" use:enhance={handleDelete} class="inline">
					<button
						type="submit"
						disabled={loading}
						class="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
					>
						{loading ? "Deleting..." : "Delete"}
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
