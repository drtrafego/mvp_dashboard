import { google } from 'googleapis';

export async function getGA4Data(accessToken: string, propertyId: string, days = 30) {
    // Standard Report for Campaign/Date (Backwards compatibility)
    return runReport(accessToken, propertyId, days,
        [{ name: 'date' }, { name: 'campaignName' }],
        [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'conversions' }]
    );
}

export async function getGA4Dimensions(accessToken: string, propertyId: string, days = 30, dimension: string) {
    // dimension: 'city', 'region', 'deviceCategory', 'operatingSystem', 'pagePath', 'sessionSource'
    return runReport(accessToken, propertyId, days,
        [{ name: 'date' }, { name: dimension }],
        [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'conversions' }]
    );
}

async function runReport(accessToken: string, propertyId: string, days: number, dimensions: any[], metrics: any[]) {
    const analyticsData = google.analyticsdata({
        version: 'v1beta',
        auth: asOAuth2Client(accessToken)
    });

    try {
        const response = await analyticsData.properties.runReport({
            property: `properties/${propertyId}`,
            requestBody: {
                dateRanges: [{
                    startDate: `${days}daysAgo`,
                    endDate: 'today',
                }],
                dimensions,
                metrics
            }
        });

        return response.data.rows?.map(row => {
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
    } catch (e) {
        console.error("GA4 Report Error:", e);
        return [];
    }
}

function asOAuth2Client(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return auth;
}
