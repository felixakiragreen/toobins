#[macro_use]
extern crate rocket;

use serde::Serialize;
use serde_json;

#[derive(Serialize)]
struct TokenMetadata {
	name: String,
	image: String,
	external_url: String,
}

#[get("/")]
fn index() -> &'static str {
	"Hello, world!"
}

#[get("/<id>")]
async fn id_handler(id: u64) -> Option<String> {
	let name: String = match id {
		0 => "Toobins".to_string(),
		id => format!("Toobins Charm #{}", id),
	};

	let image: String = match id {
		0 => "https://turquoise-acceptable-badger-753.mypinata.cloud/ipfs/QmZeEjexxbL6oNEWZZjKf3dikrDUgQDnqCiCkxnc8bGPCD?_gl=1*17ye3f4*rs_ga*MTg0ODQ2MDQxNi4xNjg3NzA4OTc1*rs_ga_5RMPXG14TE*MTY4NzcwODk3NC4xLjEuMTY4NzcwOTA0MS42MC4wLjA.".to_string(),
		_ => "https://turquoise-acceptable-badger-753.mypinata.cloud/ipfs/QmP1sEYmQoHngMTwC6mpkaDanjkUThd428JV3a2Twm1reS?_gl=1*1vw3afb*rs_ga*MTg0ODQ2MDQxNi4xNjg3NzA4OTc1*rs_ga_5RMPXG14TE*MTY4NzcwODk3NC4xLjEuMTY4NzcwOTA0MS42MC4wLjA.".to_string(),
	};

	let metadata = TokenMetadata {
		name: name,
		image: image,
		external_url: "https://www.proof.xyz/toobins".to_string(),
	};

	let metadata_str = serde_json::to_string(&metadata);

	return match metadata_str {
		Ok(string) => Some(string),
		_ => None,
	};
}

#[shuttle_runtime::main]
async fn rocket() -> shuttle_rocket::ShuttleRocket {
	let rocket = rocket::build().mount("/", routes![index, id_handler]);

	Ok(rocket.into())
}
