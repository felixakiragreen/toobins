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
	let metadata = TokenMetadata {
		name: format!("test id: {}", id),
		image: "image".to_string(),
		external_url: "URL".to_string(),
	};

	let metadata_str = serde_json::to_string(&metadata);

	return match metadata_str {
		Ok(string) => Some(string),
		_ => None,
	};

	// return metadata_str;
	// format!("requested id: {}", id)
}

#[shuttle_runtime::main]
async fn rocket() -> shuttle_rocket::ShuttleRocket {
	let rocket = rocket::build().mount("/", routes![index, id_handler]);

	Ok(rocket.into())
}
