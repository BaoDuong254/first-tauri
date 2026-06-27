use serde::{Deserialize, Serialize};

use crate::error::Error;

#[derive(Serialize)]
pub struct Quote {
    text: String,
    author: String,
}

#[derive(Deserialize)]
struct ApiQuote {
    quote: String,
    author: String,
}

#[tauri::command]
pub async fn fetch_quote() -> Result<Quote, Error> {
    let api: ApiQuote = reqwest::get("https://dummyjson.com/quotes/random")
        .await?
        .error_for_status()?
        .json()
        .await?;

    Ok(Quote {
        text: api.quote,
        author: api.author,
    })
}
