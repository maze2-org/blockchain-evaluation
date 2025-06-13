use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{
    to_binary, Addr, CosmosMsg, CustomQuery, Querier, QuerierWrapper, StdResult, WasmMsg, WasmQuery,
};

use crate::msg::{ExecuteMsg, QueryMsg};
use crate::msg::{BalanceResponse, TotalSupplyResponse, CollectedFundsResponse};

/// CwTemplateContract is a wrapper around Addr that provides a lot of helpers
/// for working with this.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct CwTemplateContract(pub Addr);

impl CwTemplateContract {
    pub fn addr(&self) -> Addr {
        self.0.clone()
    }

    pub fn call<T: Into<ExecuteMsg>>(&self, msg: T) -> StdResult<CosmosMsg> {
        let msg = to_binary(&msg.into())?;
        Ok(WasmMsg::Execute {
            contract_addr: self.addr().into(),
            msg,
            funds: vec![],
        }
        .into())
    }

    /// Get token balance for this contract address
    pub fn balance<Q, CQ>(&self, querier: &Q) -> StdResult<BalanceResponse>
    where
        Q: Querier,
        CQ: CustomQuery,
    {
        let msg = QueryMsg::GetBalance {
            address: self.addr().to_string(),
        };
        let query = WasmQuery::Smart {
            contract_addr: self.addr().into(),
            msg: to_binary(&msg)?,
        }
        .into();
        let res: BalanceResponse = QuerierWrapper::<CQ>::new(querier).query(&query)?;
        Ok(res)
    }

    /// Get total supply
    pub fn total_supply<Q, CQ>(&self, querier: &Q) -> StdResult<TotalSupplyResponse>
    where
        Q: Querier,
        CQ: CustomQuery,
    {
        let msg = QueryMsg::GetTotalSupply {};
        let query = WasmQuery::Smart {
            contract_addr: self.addr().into(),
            msg: to_binary(&msg)?,
        }
        .into();
        let res: TotalSupplyResponse = QuerierWrapper::<CQ>::new(querier).query(&query)?;
        Ok(res)
    }

    /// Get collected native funds
    pub fn collected_funds<Q, CQ>(&self, querier: &Q) -> StdResult<CollectedFundsResponse>
    where
        Q: Querier,
        CQ: CustomQuery,
    {
        let msg = QueryMsg::GetCollectedFunds {};
        let query = WasmQuery::Smart {
            contract_addr: self.addr().into(),
            msg: to_binary(&msg)?,
        }
        .into();
        let res: CollectedFundsResponse = QuerierWrapper::<CQ>::new(querier).query(&query)?;
        Ok(res)
    }
}
