import { toast as sonnerToast } from "svelte-sonner";

// Toast configuration
const toastConfig = {
	position: "top-right" as const,
	duration: 4000,
	closeButton: true,
	toastOptions: {
		classes: {
			toast:
				"group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
			closeButton: "!absolute !top-3 !right-4 !left-auto",
		},
	},
};

// Deduplication mechanism
interface ToastMessage {
	message: string;
	type: string;
	timestamp: number;
}

const recentToasts: ToastMessage[] = [];
const DEDUP_WINDOW = 3000; // 3 seconds window for deduplication

function isDuplicateToast(message: string, type: string): boolean {
	const now = Date.now();

	// Clean up old messages outside the deduplication window
	const cutoff = now - DEDUP_WINDOW;
	for (let i = recentToasts.length - 1; i >= 0; i--) {
		if (recentToasts[i].timestamp < cutoff) {
			recentToasts.splice(i, 1);
		}
	}

	// Check if this message already exists in recent toasts
	const isDuplicate = recentToasts.some(
		(toast) => toast.message === message && toast.type === type
	);

	if (!isDuplicate) {
		// Add this message to recent toasts
		recentToasts.push({ message, type, timestamp: now });
	}

	return isDuplicate;
}

// Toast API with method-based approach and deduplication
export const toast = {
	success: (message: string, options?: any) => {
		if (typeof message !== "string" || !message.trim()) return;
		if (isDuplicateToast(message, "success")) return;

		const config = { ...toastConfig, ...options };
		return sonnerToast.success(message, config);
	},
	error: (message: string, options?: any) => {
		if (typeof message !== "string" || !message.trim()) return;
		if (isDuplicateToast(message, "error")) return;

		const config = { ...toastConfig, ...options };
		return sonnerToast.error(message, config);
	},
	warning: (message: string, options?: any) => {
		if (typeof message !== "string" || !message.trim()) return;
		if (isDuplicateToast(message, "warning")) return;

		const config = { ...toastConfig, ...options };
		return sonnerToast.warning(message, config);
	},
	info: (message: string, options?: any) => {
		if (typeof message !== "string" || !message.trim()) return;
		if (isDuplicateToast(message, "info")) return;

		const config = { ...toastConfig, ...options };
		return sonnerToast.info(message, config);
	},
	// Default toast
	show: (message: string, options?: any) => {
		if (typeof message !== "string" || !message.trim()) return;
		if (isDuplicateToast(message, "default")) return;

		const config = { ...toastConfig, ...options };
		return sonnerToast(message, config);
	},
};

// Notification API with method-based approach
const createNotification = async (
	type: "success" | "error" | "warning" | "info",
	title: string,
	message: string,
	options?: {
		userId?: string;
		showToast?: boolean;
		toastOptions?: any;
	}
) => {
	const { userId, showToast = true, toastOptions } = options || {};

	try {
		// Create persistent notification
		const response = await fetch("/api/notifications", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title,
				message,
				type,
				...(userId && { userId }),
			}),
		});

		if (!response.ok) {
			throw new Error("Failed to create notification");
		}

		// Also show as toast if requested
		if (showToast) {
			toast[type](title, toastOptions);
		}

		return await response.json();
	} catch (error) {
		console.error("Error creating notification:", error);
		// Fallback to toast only if notification fails
		if (showToast) {
			toast.error("Failed to create notification");
		}
		throw error;
	}
};

export const notification = {
	success: (title: string, message: string, options?: any) =>
		createNotification("success", title, message, options),
	error: (title: string, message: string, options?: any) =>
		createNotification("error", title, message, options),
	warning: (title: string, message: string, options?: any) =>
		createNotification("warning", title, message, options),
	info: (title: string, message: string, options?: any) =>
		createNotification("info", title, message, options),
};

// Legacy methods (keeping for backward compatibility)
export const showSuccess = (message: string, options?: any) => toast.success(message, options);
export const showError = (message: string, options?: any) => toast.error(message, options);
export const showWarning = (message: string, options?: any) => toast.warning(message, options);
export const showInfo = (message: string, options?: any) => toast.info(message, options);

export const notifySuccess = (title: string, message: string, options?: any) =>
	notification.success(title, message, options);
export const notifyError = (title: string, message: string, options?: any) =>
	notification.error(title, message, options);
export const notifyWarning = (title: string, message: string, options?: any) =>
	notification.warning(title, message, options);
export const notifyInfo = (title: string, message: string, options?: any) =>
	notification.info(title, message, options);

// Legacy toast messages (keeping for backward compatibility)
export const toastMessages = {
	serviceCreated: "Service created successfully!",
	serviceUpdated: "Service updated successfully!",
	serviceDeleted: "Service deleted successfully!",
	profileUpdated: "Profile updated successfully!",
	settingsSaved: "Settings saved successfully!",
	error: "Something went wrong. Please try again.",
	unauthorized: "You are not authorized to perform this action.",
	notFound: "The requested resource was not found.",
};
