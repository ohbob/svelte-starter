import { UI_CONSTANTS } from "$lib/constants";
import { toast as sonnerToast } from "svelte-sonner";

// Toast configuration
const toastConfig = {
	position: "top-right" as const,
	duration: UI_CONSTANTS.TOAST_DURATION,
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

function isDuplicateToast(message: string, type: string): boolean {
	const now = Date.now();

	// Clean up old messages outside the deduplication window
	const cutoff = now - UI_CONSTANTS.TOAST_DEDUP_WINDOW;
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

// Legacy methods (keeping for backward compatibility)
export const showSuccess = (message: string, options?: any) => toast.success(message, options);
export const showError = (message: string, options?: any) => toast.error(message, options);
export const showWarning = (message: string, options?: any) => toast.warning(message, options);
export const showInfo = (message: string, options?: any) => toast.info(message, options);

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

// Note: Persistent notifications should be created server-side using NotificationService
// in your form actions or server-side code, not via client-side API calls.
