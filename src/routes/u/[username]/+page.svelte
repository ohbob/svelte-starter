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
		{#if data.companies.length > 0}
			<section class="mb-16">
				<h2 class="mb-8 text-3xl font-bold text-gray-900">Companies</h2>
				<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
					{#each data.companies as company}
						<div
							class="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-lg"
						>
							<div class="mb-4">
								<h3 class="text-xl font-semibold text-gray-900">{company.name}</h3>
								{#if company.description}
									<p class="mt-2 text-gray-600">{company.description}</p>
								{/if}
							</div>

							<div class="space-y-2">
								{#if company.email}
									<div class="flex items-center text-sm text-gray-600">
										<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
											></path>
										</svg>
										{company.email}
									</div>
								{/if}
								{#if company.phone}
									<div class="flex items-center text-sm text-gray-600">
										<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
											></path>
										</svg>
										{company.phone}
									</div>
								{/if}
								{#if company.address}
									<div class="flex items-center text-sm text-gray-600">
										<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
											></path>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
											></path>
										</svg>
										{company.address}
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Meeting Types Section -->
		{#if data.meetingTypes.length > 0}
			<section class="mb-16">
				<h3 class="mb-12 text-center text-3xl font-bold text-gray-900">Book a Meeting</h3>
				<div class="mx-auto max-w-4xl">
					<div class="space-y-4">
						{#each data.meetingTypes as meetingType}
							<a
								href="/u/{data.user.customUrl ||
									data.user.name ||
									data.user.id}/schedule/{meetingType.slug}"
								class="group block"
							>
								<div
									class="rounded-lg border border-gray-200 bg-white p-6 transition-all duration-200 hover:border-gray-900 hover:shadow-md"
								>
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-4">
											<div
												class="h-3 w-3 rounded-full"
												style:background-color={meetingType.color}
											></div>
											<div>
												<h4 class="text-lg font-semibold text-gray-900 group-hover:text-gray-900">
													{meetingType.name}
												</h4>
												<div class="mt-1 flex items-center gap-4 text-sm text-gray-600">
													<div class="flex items-center gap-1">
														<svg
															class="h-4 w-4"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
															></path>
														</svg>
														{meetingType.duration}m
													</div>
													{#if meetingType.price > 0}
														<div class="flex items-center gap-1">
															<svg
																class="h-4 w-4"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																	d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
																></path>
															</svg>
															${(meetingType.price / 100).toFixed(2)}
														</div>
													{:else}
														<span class="font-medium text-green-600">Free</span>
													{/if}
												</div>
												{#if meetingType.description}
													<p class="mt-2 text-sm leading-relaxed text-gray-600">
														{meetingType.description}
													</p>
												{/if}
											</div>
										</div>
										<div class="flex items-center text-gray-400 group-hover:text-gray-600">
											<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 5l7 7-7 7"
												></path>
											</svg>
										</div>
									</div>
								</div>
							</a>
						{/each}
					</div>
				</div>
			</section>
		{/if}

		{#if data.companies.length === 0 && data.meetingTypes.length === 0}
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
