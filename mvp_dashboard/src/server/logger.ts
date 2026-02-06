import { biDb } from "@/server/db";
import { systemLogs } from "@/server/db/schema";

type LogLevel = 'INFO' | 'ERROR' | 'WARN';
type LogComponent = 'META_ADS' | 'GOOGLE_ADS' | 'GA4' | 'SYSTEM';

export async function logSystem(
    organizationId: string | null,
    component: LogComponent,
    level: LogLevel,
    message: string,
    details?: any
) {
    try {
        let safeDetails = details;

        // Smart Error Serialization
        if (details instanceof Error) {
            safeDetails = {
                message: details.message,
                name: details.name,
                stack: details.stack,
                // @ts-ignore
                cause: details.cause,
            };
        } else if (typeof details === 'object' && details !== null) {
            // Handle objects that might contain errors
            try {
                safeDetails = JSON.parse(JSON.stringify(details, (key, value) => {
                    if (value instanceof Error) {
                        return {
                            message: value.message,
                            name: value.name,
                            stack: value.stack,
                        };
                    }
                    return value;
                }));
            } catch (e) {
                safeDetails = { error: "Circular structure or serialization failure" };
            }
        }

        await biDb.insert(systemLogs).values({
            organizationId: organizationId,
            component,
            level,
            message,
            details: safeDetails,
        });
    } catch (e) {
        console.error("FAILED TO WRITE LOG TO DB:", e);
        console.error("ORIGINAL LOG:", message, details);
    }
}
