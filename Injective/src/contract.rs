#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_binary, Binary, Coin, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Uint128, Addr, BankMsg,
};
use cw2::set_contract_version;
use cw_storage_plus::{Item, Map};

use crate::error::ContractError;
use crate::msg::{
    BalanceResponse, CollectedFundsResponse, ExecuteMsg, InstantiateMsg, QueryMsg, TotalSupplyResponse,
};
use crate::state::{State, STATE};

// Constants
const NATIVE_DENOM: &str = "denom";
const MINT_PRICE: Uint128 = Uint128::new(10_000_000); // 0.01 native token
const MINT_AMOUNT: Uint128 = Uint128::new(1_000_000_000); // 1000 IABS (6 decimals)

const CONTRACT_NAME: &str = "crates.io:iabs-token";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

// State
pub const BALANCES: Map<&Addr, Uint128> = Map::new("balances");
pub const TOTAL_SUPPLY: Item<Uint128> = Item::new("total_supply");
pub const COLLECTED_FUNDS: Item<Uint128> = Item::new("collected_funds");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    _msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    TOTAL_SUPPLY.save(deps.storage, &Uint128::zero())?;
    COLLECTED_FUNDS.save(deps.storage, &Uint128::zero())?;

    let state = State {
        owner: info.sender.clone(),
    };
    STATE.save(deps.storage, &state)?;

    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("owner", info.sender))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::Mint {} => try_mint(deps, info),
        ExecuteMsg::Withdraw {} => try_withdraw(deps, info),
    }
}

pub fn try_mint(deps: DepsMut, info: MessageInfo) -> Result<Response, ContractError> {
    let sent_funds = info.funds.iter().find(|c| c.denom == NATIVE_DENOM);
    let native_amount = match sent_funds {
        Some(coin) if coin.amount >= MINT_PRICE => coin.amount,
        _ => return Err(ContractError::InsufficientFunds {}),
    };

    let mut balance = BALANCES.may_load(deps.storage, &info.sender)?.unwrap_or_default();
    balance += MINT_AMOUNT;
    BALANCES.save(deps.storage, &info.sender, &balance)?;

    let mut total_supply = TOTAL_SUPPLY.may_load(deps.storage)?.unwrap_or_default();
    total_supply += MINT_AMOUNT;
    TOTAL_SUPPLY.save(deps.storage, &total_supply)?;

    let mut collected = COLLECTED_FUNDS.may_load(deps.storage)?.unwrap_or_default();
    collected += native_amount;
    COLLECTED_FUNDS.save(deps.storage, &collected)?;

    Ok(Response::new()
        .add_attribute("method", "mint")
        .add_attribute("amount", MINT_AMOUNT.to_string())
        .add_attribute("balance", balance.to_string()))
}

pub fn try_withdraw(deps: DepsMut, info: MessageInfo) -> Result<Response, ContractError> {
    let state = STATE.load(deps.storage)?;
    if info.sender != state.owner {
        return Err(ContractError::Unauthorized {});
    }

    let funds = COLLECTED_FUNDS.load(deps.storage)?;
    COLLECTED_FUNDS.save(deps.storage, &Uint128::zero())?;

    let funds_to_send = Coin {
        denom: NATIVE_DENOM.to_string(),
        amount: funds,
    };

    Ok(Response::new()
        .add_attribute("method", "withdraw")
        .add_attribute("amount", funds.to_string())
        .add_message(BankMsg::Send {
            to_address: info.sender.to_string(),
            amount: vec![funds_to_send],
        }))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetBalance { address } => {
            let addr = deps.api.addr_validate(&address)?;
            to_binary(&query_balance(deps, &addr)?)
        }
        QueryMsg::GetTotalSupply {} => to_binary(&query_total_supply(deps)?),
        QueryMsg::GetCollectedFunds {} => to_binary(&query_collected_funds(deps)?),
    }
}

fn query_balance(deps: Deps, addr: &Addr) -> StdResult<BalanceResponse> {
    let balance = BALANCES.may_load(deps.storage, addr)?.unwrap_or_default();
    Ok(BalanceResponse { balance })
}

fn query_total_supply(deps: Deps) -> StdResult<TotalSupplyResponse> {
    let total_supply = TOTAL_SUPPLY.may_load(deps.storage)?.unwrap_or_default();
    Ok(TotalSupplyResponse { total_supply })
}

fn query_collected_funds(deps: Deps) -> StdResult<CollectedFundsResponse> {
    let collected_funds = COLLECTED_FUNDS.may_load(deps.storage)?.unwrap_or_default();
    Ok(CollectedFundsResponse { collected_funds })
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies_with_balance, mock_env, mock_info};
    use cosmwasm_std::{coins, from_binary};

    #[test]
    fn proper_initialization() {
        let mut deps = mock_dependencies_with_balance(&coins(2, "denom"));

        let msg = InstantiateMsg {};
        let info = mock_info("creator", &coins(1000, "denom"));

        let res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();
        assert_eq!(0, res.messages.len());

        let res = query(deps.as_ref(), mock_env(), QueryMsg::GetTotalSupply {}).unwrap();
        let value: TotalSupplyResponse = from_binary(&res).unwrap();
        assert_eq!(Uint128::zero(), value.total_supply);

        let res = query(deps.as_ref(), mock_env(), QueryMsg::GetCollectedFunds {}).unwrap();
        let value: CollectedFundsResponse = from_binary(&res).unwrap();
        assert_eq!(Uint128::zero(), value.collected_funds);
    }

    #[test]
    fn mint_test() {
        let mut deps = mock_dependencies_with_balance(&coins(2, "denom"));

        let msg = InstantiateMsg {};
        let info = mock_info("creator", &coins(2, "denom"));
        instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();

        let info = mock_info("user", &coins(1000, "denom"));
        let msg = ExecuteMsg::Mint {};
        let res = execute(deps.as_mut(), mock_env(), info, msg);
        assert!(matches!(res, Err(ContractError::InsufficientFunds {})));

        let info = mock_info("user", &coins(10_000_000, "denom"));
        let msg = ExecuteMsg::Mint {};
        _ = execute(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();

        let res = query(
            deps.as_ref(),
            mock_env(),
            QueryMsg::GetBalance {
                address: "user".to_string(),
            },
        )
        .unwrap();
        let value: BalanceResponse = from_binary(&res).unwrap();
        assert_eq!(Uint128::new(1_000_000_000), value.balance);

        let res = query(deps.as_ref(), mock_env(), QueryMsg::GetTotalSupply {}).unwrap();
        let value: TotalSupplyResponse = from_binary(&res).unwrap();
        assert_eq!(Uint128::new(1_000_000_000), value.total_supply);

        let res = query(deps.as_ref(), mock_env(), QueryMsg::GetCollectedFunds {}).unwrap();
        let value: CollectedFundsResponse = from_binary(&res).unwrap();
        assert_eq!(Uint128::new(10_000_000), value.collected_funds);
    }

    #[test]
    fn withdraw_test() {
        let mut deps = mock_dependencies_with_balance(&coins(2, "denom"));

        let msg = InstantiateMsg {};
        let info = mock_info("creator", &coins(2, "denom"));
        instantiate(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();

        let user_info = mock_info("user", &coins(10_000_000, "denom"));
        let mint_msg = ExecuteMsg::Mint {};
        _ = execute(deps.as_mut(), mock_env(), user_info, mint_msg).unwrap();

        let attacker_info = mock_info("attacker", &coins(2, "denom"));
        let withdraw_msg = ExecuteMsg::Withdraw {};
        let res = execute(deps.as_mut(), mock_env(), attacker_info, withdraw_msg);
        assert!(matches!(res, Err(ContractError::Unauthorized {})));

        _ = execute(deps.as_mut(), mock_env(), info, ExecuteMsg::Withdraw {}).unwrap();

        let res = query(deps.as_ref(), mock_env(), QueryMsg::GetCollectedFunds {}).unwrap();
        let value: CollectedFundsResponse = from_binary(&res).unwrap();
        assert_eq!(Uint128::zero(), value.collected_funds);
    }
}
