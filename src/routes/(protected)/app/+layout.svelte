<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Avatar } from "$lib/components/ui/avatar";
	import { authClient } from "$lib/auth-client";

	let { data, children } = $props();

	const handleSignOut = async () => {
		await authClient.signOut();
		window.location.href = "/";
	};
</script>

<div class="flex flex-col gap-4 p-4">
	<header class="flex items-center justify-between border-b pb-4">
		<h1 class="text-4xl font-bold">App</h1>
		<div class="flex items-center gap-4">
			<div class="flex items-center gap-3">
				<Avatar
					src={data.user.image}
					name={data.user.name || data.user.email}
					alt={data.user.name || data.user.email}
					size="md"
				/>
				<div class="text-sm">
					Welcome, {data.user.name || data.user.email}
				</div>
			</div>
			<Button onclick={handleSignOut} variant="outline" size="sm">Sign Out</Button>
		</div>
	</header>

	<main class="flex-1">
		{@render children()}
	</main>
</div>
