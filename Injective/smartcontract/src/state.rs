use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::Addr;
use cw_storage_plus::Item;

/// Core contract state
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
    /// Owner address allowed to withdraw collected funds
    pub owner: Addr,
}

/// Singleton item storing the contract state
pub const STATE: Item<State> = Item::new("state");
