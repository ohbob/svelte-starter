import { db } from "$lib/server/db";
import {
	LOCATION_TYPES,
	locations,
	VIRTUAL_PLATFORMS,
	type Location,
	type NewLocation,
} from "$lib/server/schema";
import { and, desc, eq } from "drizzle-orm";

export class LocationService {
	/**
	 * Get all locations for a company
	 */
	static async getByCompany(companyId: string): Promise<Location[]> {
		return await db
			.select()
			.from(locations)
			.where(and(eq(locations.companyId, companyId), eq(locations.isActive, true)))
			.orderBy(desc(locations.isDefault), locations.name);
	}

	/**
	 * Get a single location by ID
	 */
	static async getById(id: string, companyId: string): Promise<Location | null> {
		const result = await db
			.select()
			.from(locations)
			.where(and(eq(locations.id, id), eq(locations.companyId, companyId)))
			.limit(1);

		return result[0] || null;
	}

	/**
	 * Create a new location
	 */
	static async create(
		companyId: string,
		data: Omit<NewLocation, "id" | "companyId" | "createdAt" | "updatedAt">
	): Promise<Location> {
		// If this is set as default, unset other defaults
		if (data.isDefault) {
			await db
				.update(locations)
				.set({ isDefault: false, updatedAt: new Date() })
				.where(and(eq(locations.companyId, companyId), eq(locations.isDefault, true)));
		}

		const newLocation: Omit<NewLocation, "id"> = {
			companyId,
			...data,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const result = await db.insert(locations).values(newLocation).returning();
		return result[0];
	}

	/**
	 * Update a location
	 */
	static async update(
		id: string,
		companyId: string,
		data: Partial<Omit<NewLocation, "id" | "companyId" | "createdAt">>
	): Promise<Location | null> {
		// If this is set as default, unset other defaults
		if (data.isDefault) {
			await db
				.update(locations)
				.set({ isDefault: false, updatedAt: new Date() })
				.where(and(eq(locations.companyId, companyId), eq(locations.isDefault, true)));
		}

		const result = await db
			.update(locations)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(locations.id, id), eq(locations.companyId, companyId)))
			.returning();

		return result[0] || null;
	}

	/**
	 * Soft delete a location (set isActive to false)
	 */
	static async delete(id: string, companyId: string): Promise<boolean> {
		const result = await db
			.update(locations)
			.set({ isActive: false, updatedAt: new Date() })
			.where(and(eq(locations.id, id), eq(locations.companyId, companyId)))
			.returning();

		return result.length > 0;
	}

	/**
	 * Get the default location for a company
	 */
	static async getDefault(companyId: string): Promise<Location | null> {
		const result = await db
			.select()
			.from(locations)
			.where(
				and(
					eq(locations.companyId, companyId),
					eq(locations.isActive, true),
					eq(locations.isDefault, true)
				)
			)
			.limit(1);

		return result[0] || null;
	}

	/**
	 * Generate a Google Meet link for virtual locations
	 * This is a placeholder - you'll need to implement actual Google Meet API integration
	 */
	static async generateGoogleMeetLink(locationId: string): Promise<string> {
		// TODO: Implement Google Meet API integration
		// For now, return a placeholder URL
		return `https://meet.google.com/${crypto.randomUUID()}`;
	}

	/**
	 * Get location details for a booking (includes meeting link generation for virtual locations)
	 */
	static async getLocationForBooking(
		locationId: string,
		companyId: string
	): Promise<{
		location: Location;
		meetingLink?: string;
		locationDetails: string;
	} | null> {
		const location = await this.getById(locationId, companyId);
		if (!location) return null;

		let meetingLink: string | undefined;
		let locationDetails: string;

		if (location.type === LOCATION_TYPES.VIRTUAL) {
			// Generate meeting link for virtual locations
			if (location.platform === VIRTUAL_PLATFORMS.GOOGLE_MEET && location.autoGenerateLink) {
				meetingLink = await this.generateGoogleMeetLink(locationId);
			} else if (location.customMeetingUrl) {
				meetingLink = location.customMeetingUrl;
			}

			// Format virtual location details
			locationDetails = `Virtual Meeting - ${location.name}`;
			if (location.meetingInstructions) {
				locationDetails += `\n\nInstructions:\n${location.meetingInstructions}`;
			}
			if (meetingLink) {
				locationDetails += `\n\nJoin URL: ${meetingLink}`;
			}
		} else {
			// Format in-person location details
			locationDetails = `${location.name}`;
			if (location.address) {
				locationDetails += `\n${location.address}`;
				if (location.city) locationDetails += `, ${location.city}`;
				if (location.state) locationDetails += `, ${location.state}`;
				if (location.country) locationDetails += `, ${location.country}`;
				if (location.postalCode) locationDetails += ` ${location.postalCode}`;
			}

			if (location.phone) {
				locationDetails += `\nPhone: ${location.phone}`;
			}

			if (location.contactPerson) {
				locationDetails += `\nContact: ${location.contactPerson}`;
			}

			if (location.instructions) {
				locationDetails += `\n\nInstructions:\n${location.instructions}`;
			}
		}

		return {
			location,
			meetingLink,
			locationDetails,
		};
	}

	/**
	 * Validate location data based on type
	 */
	static validateLocationData(data: Partial<NewLocation>): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!data.name?.trim()) {
			errors.push("Name is required");
		}

		if (!data.type || !Object.values(LOCATION_TYPES).includes(data.type as any)) {
			errors.push("Valid location type is required");
		}

		if (data.type === LOCATION_TYPES.IN_PERSON) {
			if (!data.address?.trim()) {
				errors.push("Address is required for in-person locations");
			}
		}

		if (data.type === LOCATION_TYPES.VIRTUAL) {
			if (!data.platform || !Object.values(VIRTUAL_PLATFORMS).includes(data.platform as any)) {
				errors.push("Valid platform is required for virtual locations");
			}

			if (data.platform === VIRTUAL_PLATFORMS.CUSTOM && !data.customMeetingUrl?.trim()) {
				errors.push("Custom meeting URL is required for custom platform");
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}
}
