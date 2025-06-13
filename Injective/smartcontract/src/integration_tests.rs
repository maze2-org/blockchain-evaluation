#[cfg(test)]
mod tests {
    use crate::helpers::CwTemplateContract;
    use crate::msg::{InstantiateMsg, ExecuteMsg, QueryMsg, BalanceResponse};
    use cosmwasm_std::{Addr, Coin, Empty, Uint128};
    use cw_multi_test::{App, AppBuilder, Contract, ContractWrapper, Executor};

    pub fn contract_template() -> Box<dyn Contract<Empty>> {
        let contract = ContractWrapper::new(
            crate::contract::execute,
            crate::contract::instantiate,
            crate::contract::query,
        );
        Box::new(contract)
    }

    const USER: &str = "user";
    const ADMIN: &str = "admin";
    const NATIVE_DENOM: &str = "denom";

    fn mock_app() -> App {
        AppBuilder::new().build(|router, _, storage| {
            router
                .bank
                .init_balance(
                    storage,
                    &Addr::unchecked(USER),
                    vec![Coin {
                        denom: NATIVE_DENOM.to_string(),
                        amount: Uint128::new(100_000_000),
                    }],
                )
                .unwrap();
        })
    }

    fn proper_instantiate() -> (App, CwTemplateContract) {
        let mut app = mock_app();
        let cw_template_id = app.store_code(contract_template());

        let msg = InstantiateMsg {};
        let cw_template_contract_addr = app
            .instantiate_contract(
                cw_template_id,
                Addr::unchecked(ADMIN),
                &msg,
                &[],
                "test",
                None,
            )
            .unwrap();

        let cw_template_contract = CwTemplateContract(cw_template_contract_addr);

        (app, cw_template_contract)
    }

    mod token {
        use super::*;

        #[test]
        fn mint() {
            let (mut app, cw_template_contract) = proper_instantiate();

            let msg = ExecuteMsg::Mint {};
            let result = app.execute_contract(
                Addr::unchecked(USER),
                cw_template_contract.addr(),
                &msg,
                &[],
            );
            assert!(result.is_err(), "Expected mint to fail with no funds");

            let mint_funds = vec![Coin {
                denom: NATIVE_DENOM.to_string(),
                amount: Uint128::new(10_000_000),
            }];

            app.execute_contract(
                Addr::unchecked(USER),
                cw_template_contract.addr(),
                &msg,
                &mint_funds,
            )
            .unwrap();

            let balance: Uint128 = app
                .wrap()
                .query_wasm_smart::<BalanceResponse>(
                    cw_template_contract.addr(),
                    &QueryMsg::GetBalance {
                        address: USER.to_string(),
                    },
                )
                .unwrap()
                .balance;
            assert_eq!(balance, Uint128::new(1_000_000_000));

            let total_supply = cw_template_contract.total_supply::<App, Empty>(&app).unwrap();
            assert_eq!(total_supply.total_supply, Uint128::new(1_000_000_000));

            let collected = cw_template_contract.collected_funds::<App, Empty>(&app).unwrap();
            assert_eq!(collected.collected_funds, Uint128::new(10_000_000));
        }

        #[test]
        fn withdraw() {
            let (mut app, cw_template_contract) = proper_instantiate();

            let mint_funds = vec![Coin {
                denom: NATIVE_DENOM.to_string(),
                amount: Uint128::new(10_000_000),
            }];

            let msg = ExecuteMsg::Mint {};
            app.execute_contract(
                Addr::unchecked(USER),
                cw_template_contract.addr(),
                &msg,
                &mint_funds,
            )
            .unwrap();

            let msg = ExecuteMsg::Withdraw {};
            let cosmos_msg = cw_template_contract.call(msg.clone()).unwrap();
            let result = app.execute(Addr::unchecked(USER), cosmos_msg);
            assert!(result.is_err(), "Expected unauthorized withdraw to fail");

            let cosmos_msg = cw_template_contract.call(msg).unwrap();
            _ = app.execute(Addr::unchecked(ADMIN), cosmos_msg).unwrap();

            let collected = cw_template_contract.collected_funds::<App, Empty>(&app).unwrap();
            assert_eq!(collected.collected_funds, Uint128::zero());
        }
    }
}
