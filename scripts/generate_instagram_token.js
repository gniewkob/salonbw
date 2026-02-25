const readline = require("readline");
const https = require("https");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const question = (query) =>
    new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log("--- Instagram Long-Lived Token Generator ---");
    console.log(
        "This script will help you exchange a short-lived access token for a long-lived one (valid for 60 days).",
    );

    try {
        const appId = await question("Enter your Facebook App ID: ");
        const appSecret = await question("Enter your Facebook App Secret: ");
        const shortLivedToken = await question(
            "Enter your Short-Lived Access Token: ",
        );

        if (!appId || !appSecret || !shortLivedToken) {
            console.error(
                "Error: App ID, App Secret, and Short-Lived Token are required.",
            );
            process.exit(1);
        }

        const url = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortLivedToken}`;

        console.log("\nExchanging token...");

        https
            .get(url, (res) => {
                let data = "";

                res.on("data", (chunk) => {
                    data += chunk;
                });

                res.on("end", () => {
                    try {
                        const response = JSON.parse(data);

                        if (response.error) {
                            console.error(
                                "\nError from Instagram API:",
                                response.error.message,
                            );
                        } else if (response.access_token) {
                            console.log(
                                "\nSUCCESS! Here is your long-lived access token:",
                            );
                            console.log(
                                "--------------------------------------------------",
                            );
                            console.log(response.access_token);
                            console.log(
                                "--------------------------------------------------",
                            );
                            console.log(
                                `Expires in: ${response.expires_in} seconds (${Math.round(response.expires_in / 86400)} days)`,
                            );
                            console.log(
                                "\nSave this token in your .env file as INSTAGRAM_ACCESS_TOKEN.",
                            );
                        } else {
                            console.error(
                                "\nUnknown error. Response:",
                                response,
                            );
                        }
                    } catch (e) {
                        console.error("\nError parsing response:", e.message);
                        console.error("Raw response:", data);
                    }
                    rl.close();
                });
            })
            .on("error", (err) => {
                console.error("\nNetwork error:", err.message);
                rl.close();
            });
    } catch (error) {
        console.error("An error occurred:", error);
        rl.close();
    }
}

main();
