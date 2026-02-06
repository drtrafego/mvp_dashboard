
console.log("Verifying organizations via API...");

async function verify() {
    try {
        const res = await fetch('http://localhost:3000/api/debug/orgs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'list-orgs' })
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log("Organizations found:", JSON.stringify(data.organizations, null, 2));

        const casal = data.organizations.find(o => o.name === "Casal do Trafego");
        if (casal) {
            console.log("✅ SUCCESS: Casal do Trafego found:", casal);
        } else {
            console.log("❌ FAILURE: Casal do Trafego NOT found.");
        }
    } catch (e) {
        console.error("Error verifying:", e);
    }
}

verify();
