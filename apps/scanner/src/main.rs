use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

mod domain;
mod application;
mod infrastructure;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber)?;

    info!("Starting Vigil Scanner...");

    // TODO: Initialize infrastructure (DB, RPC)
    // TODO: Start event loop

    Ok(())
}
