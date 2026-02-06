import { google } from 'googleapis';

export async function getGA4Data(accessToken: string, propertyId: string, days = 30) {
    const analyticsData = google.analyticsdata({
        version: 'v1beta',
        auth: asOAuth2Client(accessToken)
    });

    const response = await analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
            dateRanges: [{
                startDate: `${days}daysAgo`,
                endDate: 'today',
            }],
            dimensions: [
                { name: 'date' },
                { name: 'sessionSource' },
                { name: 'sessionMedium' },
                { name: 'campaignName' }
            ],
            metrics: [
                { name: 'sessions' },
                { name: 'totalUsers' },
                { name: 'conversions' },
                { name: 'advertiserAdCost' }
            ]
        }
    });

    return response.data.rows?.map(row => ({
        date: row.dimensionValues?.[0].value,
        source: row.dimensionValues?.[1].value,
        medium: row.dimensionValues?.[2].value,
        campaign: row.dimensionValues?.[3].value,
        sessions: Number(row.metricValues?.[0].value),
        users: Number(row.metricValues?.[1].value),
        conversions: Number(row.metricValues?.[2].value),
        cost: Number(row.metricValues?.[3].value)
    })) || [];
}

function asOAuth2Client(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return auth;
}
