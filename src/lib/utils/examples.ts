// Example usage of the new toast and notification APIs

import { notification, toast } from "./toast";

// ✅ SIMPLE TOAST USAGE - Much cleaner!
toast.success("Operation completed!");
toast.error("Something went wrong");
toast.warning("Please check your input");
toast.info("New feature available");
toast.show("Generic message");

// With custom options
toast.success("Saved!", { duration: 2000 });
toast.error("Failed!", { duration: 6000 });

// ✅ SIMPLE NOTIFICATION USAGE (persistent in database)
// Creates a notification for the current user
notification.success("Payment Received", "You received $150 for your web development service");
notification.error("Payment Failed", "There was an issue processing your payment");
notification.warning("Storage Full", "Your storage is 90% full");
notification.info("New Feature", "Dark mode is now available!");

// Creates notification for specific user (server-side usage)
notification.info("New Message", "You have a new message from John", {
	userId: "user123",
});

// Create notification without showing toast
notification.warning("Maintenance", "Scheduled maintenance tonight", {
	showToast: false,
});

// Create notification with custom toast options
notification.success("Backup Complete", "Your data has been backed up", {
	toastOptions: { duration: 6000 },
});

// ✅ REAL WORLD EXAMPLES

// In a form submission
async function createService(serviceData: any) {
	try {
		const response = await fetch("/api/services", {
			method: "POST",
			body: JSON.stringify(serviceData),
		});

		if (response.ok) {
			// Show immediate feedback + create persistent notification
			toast.success("Service created!");
			notification.success(
				"Service Created",
				"Your new service is now available on your portfolio",
				{
					showToast: false, // Don't double-toast
				}
			);
		}
	} catch (error) {
		toast.error("Failed to create service");
	}
}

// Server-side notification (in API routes)
async function notifyUser(userId: string) {
	// This would be called from server-side code
	await notification.info("Welcome!", "Thanks for joining our platform", {
		userId,
		showToast: false, // Server-side, no toast needed
	});
}

// Error handling
async function uploadFile(file: File) {
	try {
		if (file.size > 10 * 1024 * 1024) {
			toast.warning("File too large");
			return;
		}

		const result = await upload(file);
		toast.success("File uploaded!");
		notification.success("Upload Complete", `${file.name} has been uploaded successfully`);
	} catch (error) {
		toast.error("Upload failed");
		notification.error("Upload Error", "There was a problem uploading your file");
	}
}

// Quick feedback patterns
function saveSettings() {
	toast.info("Saving...");
	// ... save logic
	toast.success("Settings saved!");
}

function deleteItem() {
	toast.warning("Item deleted");
	notification.info("Item Deleted", "The item has been removed from your collection");
}
