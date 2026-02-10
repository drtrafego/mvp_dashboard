import { google } from 'googleapis';

export async function getGA4Data(accessToken: string, propertyId: string, days = 30) {
    // Switch to Session Default Channel Group to capture ALL traffic (Direct, Organic, etc.)
    // comparable to the "Channel Grouping" view in GA4 UI.
    return runReport(
        accessToken,
        propertyId,
        days,
        'today',
        [{ name: 'date' }, { name: 'sessionDefaultChannelGroup' }],
        [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'conversions' }]
    );
}

export async function getGA4Dimensions(accessToken: string, propertyId: string, days = 30, dimension: string) {
    // dimension: 'city', 'region', 'deviceCategory', 'operatingSystem', 'pagePath', 'sessionSource'
    return runReport(
        accessToken,
        propertyId,
        days,
        'today',
        [{ name: 'date' }, { name: dimension }],
        [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'conversions' }]
    );
}

/**
 * Universal helper to run GA4 reports with OAuth
 */
export async function runReport(
    accessToken: string,
    propertyId: string,
    startDate: string | number,
    endDate: string | number,
    dimensions: any[],
    metrics: any[],
    orderBys?: any[],
    limit?: number
) {
    const analyticsData = google.analyticsdata({
        version: 'v1beta',
        auth: asOAuth2Client(accessToken)
    });

    try {
        const response = await analyticsData.properties.runReport({
            property: `properties/${propertyId}`,
            requestBody: {
                dateRanges: [{
                    startDate: typeof startDate === 'number' ? `${startDate}daysAgo` : String(startDate),
                    endDate: typeof endDate === 'number' ? 'today' : String(endDate),
                }],
                dimensions,
                metrics,
                orderBys,
                limit: limit as any // Explicit cast to fix TS overload mismatch
            }
        });

        // console.log("GA4 Response Rows:", response.data.rows?.length);

        return response.data.rows?.map((row: any) => {
            const result: any = {};
            // Map dimensions
            dimensions.forEach((dim, index) => {
                result[dim.name] = row.dimensionValues?.[index].value;
            });
            // Map metrics
            metrics.forEach((met, index) => {
                result[met.name] = Number(row.metricValues?.[index].value);
            });
            return result;
        }) || [];
    } catch (e: any) {
        console.error("GA4 Report Error:", e.message || e);
        // Throw error so caller can handle it (essential for analytics page to show "Auth Error" if token fails)
        throw e;
    }
}

function asOAuth2Client(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return auth;
}
