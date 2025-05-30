<script lang="ts">
	import { Avatar } from "$lib/components/ui/avatar";
	import { Button } from "$lib/components/ui/button";

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.user.name}'s Portfolio - Services & Skills</title>
	<meta
		name="description"
		content="Discover {data.user
			.name}'s professional services and get in touch for your next project."
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
	<!-- Header -->
	<header class="bg-white shadow-sm">
		<div class="container mx-auto px-4 py-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<Avatar src={data.user.image} name={data.user.name} alt={data.user.name} size="lg" />
					<div>
						<h1 class="text-2xl font-bold text-gray-900">{data.user.name}</h1>
						<p class="text-gray-600">Professional Services</p>
					</div>
				</div>
				<Button href="mailto:{data.user.email}" size="sm">Get In Touch</Button>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="container mx-auto px-4 py-12">
		<!-- Hero Section -->
		<div class="mb-16 text-center">
			<h2 class="mb-4 text-4xl font-bold text-gray-900">
				Welcome to {data.user.name}'s Portfolio
			</h2>
			<p class="mx-auto max-w-2xl text-xl text-gray-600">
				Explore my professional services and let's work together on your next project.
			</p>
		</div>

		<!-- Services Section -->
		{#if data.services.length > 0}
			<section class="mb-16">
				<h3 class="mb-12 text-center text-3xl font-bold text-gray-900">My Services</h3>
				<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
					{#each data.services as service}
						<div
							class="rounded-xl bg-white p-8 shadow-lg transition-shadow duration-300 hover:shadow-xl"
						>
							<div class="mb-4 flex items-start justify-between">
								<div class="flex-1">
									<h4 class="mb-2 text-xl font-semibold text-gray-900">{service.title}</h4>
									{#if service.category}
										<span
											class="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
										>
											{service.category}
										</span>
									{/if}
								</div>
								<div class="text-right">
									<div class="text-2xl font-bold text-green-600">{service.price}</div>
								</div>
							</div>
							<p class="mb-6 leading-relaxed text-gray-600">{service.description}</p>
							<Button
								href="mailto:{data.user.email}?subject=Inquiry about {service.title}"
								class="w-full"
							>
								Contact for {service.title}
							</Button>
						</div>
					{/each}
				</div>
			</section>
		{:else}
			<section class="py-16 text-center">
				<div class="mx-auto max-w-md rounded-xl bg-white p-12 shadow-lg">
					<h3 class="mb-4 text-2xl font-semibold text-gray-900">Coming Soon</h3>
					<p class="mb-6 text-gray-600">
						{data.user.name} is currently setting up their services. Check back soon!
					</p>
					<Button href="mailto:{data.user.email}">
						Contact {data.user.name}
					</Button>
				</div>
			</section>
		{/if}

		<!-- Contact Section -->
		<section class="rounded-xl bg-white p-12 text-center shadow-lg">
			<h3 class="mb-4 text-3xl font-bold text-gray-900">Ready to Work Together?</h3>
			<p class="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
				I'm always excited to take on new projects and collaborate with amazing clients. Let's
				discuss how I can help bring your vision to life.
			</p>
			<div class="flex flex-col justify-center gap-4 sm:flex-row">
				<Button href="mailto:{data.user.email}" size="lg">Send Email</Button>
				<Button href="mailto:{data.user.email}?subject=Project Inquiry" variant="outline" size="lg">
					Project Inquiry
				</Button>
			</div>
		</section>
	</main>

	<!-- Footer -->
	<footer class="mt-16 border-t bg-white">
		<div class="container mx-auto px-4 py-8 text-center">
			<p class="text-gray-600">
				© 2024 {data.user.name}. Professional portfolio powered by our platform.
			</p>
		</div>
	</footer>
</div>
