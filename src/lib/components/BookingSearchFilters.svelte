<script>
	import { goto } from "$app/navigation";

	let { searchQuery = $bindable(), statusFilter = $bindable() } = $props();

	function handleSearch() {
		const url = new URL(window.location.href);
		if (searchQuery.trim()) {
			url.searchParams.set("search", searchQuery.trim());
		} else {
			url.searchParams.delete("search");
		}
		url.searchParams.set("page", "1");
		goto(url.toString());
	}

	function handleStatusFilter() {
		const url = new URL(window.location.href);
		if (statusFilter !== "all") {
			url.searchParams.set("status", statusFilter);
		} else {
			url.searchParams.delete("status");
		}
		url.searchParams.set("page", "1");
		goto(url.toString());
	}
</script>

<div
	class="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center"
>
	<div class="flex-1">
		<div class="relative">
			<svg
				class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/>
			</svg>
			<input
				type="text"
				placeholder="Search bookings..."
				bind:value={searchQuery}
				onkeydown={(e) => e.key === "Enter" && handleSearch()}
				class="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
			/>
		</div>
	</div>
	<div class="flex items-center gap-2">
		<select
			bind:value={statusFilter}
			onchange={handleStatusFilter}
			class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
		>
			<option value="all">All Status</option>
			<option value="pending">Pending</option>
			<option value="confirmed">Confirmed</option>
			<option value="cancelled">Cancelled</option>
			<option value="rejected">Rejected</option>
			<option value="completed">Completed</option>
		</select>
		<button
			type="button"
			onclick={handleSearch}
			class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
		>
			Search
		</button>
	</div>
</div>
