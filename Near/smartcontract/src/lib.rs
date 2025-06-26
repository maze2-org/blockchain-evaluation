use near_contract_standards::fungible_token::metadata::{FungibleTokenMetadata, FT_METADATA_SPEC};
use near_contract_standards::fungible_token::{FungibleToken, FungibleTokenCore, FungibleTokenResolver};
use near_contract_standards::storage_management::{StorageBalance, StorageBalanceBounds, StorageManagement};
use near_sdk::borsh::BorshSerialize;
use near_sdk::collections::LazyOption;
use near_sdk::json_types::U128;
use near_sdk::{env, log, near, require, AccountId, BorshStorageKey, PanicOnDefault, Promise, PromiseOrValue};
use near_sdk::NearToken;

use near_sdk::{PublicKey, CurveType};
use std::panic::{catch_unwind, AssertUnwindSafe};
use near_sdk::serde_json::json;



/// Mint price : 0.01 NEAR
const MINT_PRICE: NearToken = NearToken::from_yoctonear(10u128.pow(22));

/// Quantity of tokens per call : 1000 * 10^décimales
const MINT_AMOUNT: u128 = 1000u128 * 10u128.pow(24);

const DATA_IMAGE_SVG_NEAR_ICON: &str = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 288 288'%3E%3Cg id='l' data-name='l'%3E%3Cpath d='M187.58,79.81l-30.1,44.69a3.2,3.2,0,0,0,4.75,4.2L191.86,103a1.2,1.2,0,0,1,2,.91v80.46a1.2,1.2,0,0,1-2.12.77L102.18,77.93A15.35,15.35,0,0,0,90.47,72.5H87.34A15.34,15.34,0,0,0,72,87.84V201.16A15.34,15.34,0,0,0,87.34,216.5h0a15.35,15.35,0,0,0,13.08-7.31l30.1-44.69a3.2,3.2,0,0,0-4.75-4.2L96.14,186a1.2,1.2,0,0,1-2-.91V104.61a1.2,1.2,0,0,1,2.12-.77l89.55,107.23a15.35,15.35,0,0,0,11.71,5.43h3.13A15.34,15.34,0,0,0,216,201.16V87.84A15.34,15.34,0,0,0,200.66,72.5h0A15.35,15.35,0,0,0,187.58,79.81Z'/%3E%3C/g%3E%3C/svg%3E";

#[derive(PanicOnDefault)]
#[near(contract_state)]
pub struct Contract {
    owner: AccountId,
    token: FungibleToken,
    metadata: LazyOption<FungibleTokenMetadata>,
}

#[derive(BorshSerialize, BorshStorageKey)]
#[borsh(crate = "near_sdk::borsh")]
enum StorageKey {
    FungibleToken,
    Metadata,
}

#[near]
impl Contract {
    #[init]
    pub fn new_default_meta(owner_id: AccountId, total_supply: U128) -> Self {
        Self::new(
            owner_id.clone(),
            total_supply,
            FungibleTokenMetadata {
                spec: FT_METADATA_SPEC.to_string(),
                name: "IabsisToken".to_string(),
                symbol: "IABS".to_string(),
                icon: Some(DATA_IMAGE_SVG_NEAR_ICON.to_string()),
                reference: None,
                reference_hash: None,
                decimals: 24,
            },
        )
    }

    #[init]
    pub fn new(owner_id: AccountId, total_supply: U128, metadata: FungibleTokenMetadata) -> Self {
        require!(!env::state_exists(), "Already initialized");
        metadata.assert_valid();
        let mut this = Self {
            owner: owner_id.clone(),
            token: FungibleToken::new(StorageKey::FungibleToken),
            metadata: LazyOption::new(StorageKey::Metadata, Some(&metadata)),
        };
        this.token.internal_register_account(&owner_id);
        this.token.internal_deposit(&owner_id, total_supply.into());

        near_contract_standards::fungible_token::events::FtMint {
            owner_id: &owner_id,
            amount: total_supply,
            memo: Some("new tokens are minted"),
        }
        .emit();

        this
    }

    pub fn ft_metadata(&self) -> FungibleTokenMetadata {
        self.metadata.get().unwrap()
    }

    /// Mint against 0.01 NEAR
    #[payable]
    pub fn mint(&mut self) {
        let deposit = env::attached_deposit();
        require!(deposit >= MINT_PRICE, "Insufficient payment, need at least 0.01 NEAR");
        let caller = env::predecessor_account_id();


        if !self.token.accounts.contains_key(&caller) {
            self.token.internal_register_account(&caller);
        }

        self.token.internal_deposit(&caller, MINT_AMOUNT);
        near_contract_standards::fungible_token::events::FtMint {
            owner_id: &caller,
            amount: U128(MINT_AMOUNT),
            memo: Some("mint via payment"),
        }
        .emit();
    }

    /// Withdraw tout le solde du contrat vers l'owner
    pub fn withdraw(&mut self) {
        let caller = env::predecessor_account_id();
        require!(caller == self.owner, "Only owner can withdraw");

        let storage_required = env::storage_usage() as u128 * env::storage_byte_cost().as_yoctonear();
        let min_balance = NearToken::from_yoctonear(storage_required);
        let balance = env::account_balance();

        require!(
            balance > min_balance,
            format!(
                "Not enough balance to withdraw. Current: {} yoctoNEAR, Required: {} yoctoNEAR",
                balance.as_yoctonear(),
                min_balance.as_yoctonear()
            )
        );

        let amount_to_transfer = balance.checked_sub(min_balance).unwrap();
        Promise::new(self.owner.clone()).transfer(amount_to_transfer);
    }

    pub fn get_owner(&self) -> AccountId {
        self.owner.clone()
    }
}

#[near]
impl FungibleTokenCore for Contract {
    #[payable]
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>) {
        self.token.ft_transfer(receiver_id, amount, memo)
    }

    #[payable]
    fn ft_transfer_call(
        &mut self,
        receiver_id: AccountId,
        amount: U128,
        memo: Option<String>,
        msg: String,
    ) -> PromiseOrValue<U128> {
        self.token.ft_transfer_call(receiver_id, amount, memo, msg)
    }

    fn ft_total_supply(&self) -> U128 {
        self.token.ft_total_supply()
    }

    fn ft_balance_of(&self, account_id: AccountId) -> U128 {
        self.token.ft_balance_of(account_id)
    }
}

#[near]
impl FungibleTokenResolver for Contract {
    #[private]
    fn ft_resolve_transfer(
        &mut self,
        sender_id: AccountId,
        receiver_id: AccountId,
        amount: U128,
    ) -> U128 {
        let (used_amount, burned_amount) =
            self.token
                .internal_ft_resolve_transfer(&sender_id, receiver_id, amount);
        if burned_amount > 0 {
            log!("Account @{} burned {}", sender_id, burned_amount);
        }
        used_amount.into()
    }
}



#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::{testing_env, AccountId, NearToken, PublicKey, CurveType};
    use near_sdk::serde_json::json;
    use near_sdk::json_types::U128;
    use std::panic::AssertUnwindSafe;

    // Constantes du contrat pour les tests
    const MINT_PRICE: NearToken = NearToken::from_yoctonear(10u128.pow(22)); // 0.01 Ⓝ
    const MINT_AMOUNT: u128 = 1000u128 * 10u128.pow(24);
    const INITIAL_BALANCE: NearToken = NearToken::from_yoctonear(10);

    fn default_context() -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id("contract.testnet".parse::<AccountId>().unwrap())
            .signer_account_pk(
                PublicKey::from_parts(CurveType::ED25519, vec![0u8; 32]).unwrap(),
            )
            .block_height(0)
            .block_timestamp(0)
            .epoch_height(19);
        builder
    }

    fn get_context(
        predecessor: &str,
        attached: NearToken,
        balance: NearToken,
    ) -> VMContextBuilder {
        let mut ctx = default_context();
        ctx.predecessor_account_id(predecessor.parse::<AccountId>().unwrap())
            .signer_account_id(predecessor.parse::<AccountId>().unwrap())
            .attached_deposit(attached)
            .account_balance(balance);
        ctx
    }
  

    #[test]
    fn test_initialization_and_mint() {
        // Init
        let ctx = get_context(
            "alice.testnet",
            NearToken::from_yoctonear(0),
            INITIAL_BALANCE,
        );
        testing_env!(ctx.build());

        let mut contract = Contract::new_default_meta(
            "alice.testnet".parse::<AccountId>().unwrap(),
            U128(1_000_000),
        );

        assert_eq!(
            contract.owner,
            "alice.testnet".parse::<AccountId>().unwrap()
        );
        assert_eq!(contract.ft_total_supply().0, 1_000_000);

        // Mint OK
        let ctx2 = get_context("bob.testnet", MINT_PRICE, INITIAL_BALANCE);
        testing_env!(ctx2.build());
        contract.mint();

        assert_eq!(
            contract.ft_balance_of("bob.testnet".parse::<AccountId>().unwrap()).0,
            MINT_AMOUNT
        );

        // Mint panic if not enough balance
        let ctx3 = get_context("eve.testnet", NearToken::from_millinear(9), INITIAL_BALANCE);
        testing_env!(ctx3.build());
        let res = std::panic::catch_unwind(AssertUnwindSafe(|| contract.mint()));
        assert!(res.is_err());
    }

    #[test]
    fn test_withdraw() {
        let owner_id = "owner.testnet".parse::<AccountId>().unwrap();
        let mut contract = Contract::new_default_meta(owner_id.clone(), U128(0));

        // 🔸 Essai par un non-propriétaire (doit échouer)
        let ctx_non_owner = get_context(
            "mallory.testnet",
            NearToken::from_yoctonear(0),
            NearToken::from_yoctonear(20), // balance simulée
        );
        testing_env!(ctx_non_owner.build());
        let err = std::panic::catch_unwind(AssertUnwindSafe(|| contract.withdraw()));
        assert!(err.is_err());

        // 🔸 Appel correct avec owner + balance suffisante
        let ctx_owner = get_context(
            "owner.testnet",
            NearToken::from_yoctonear(0),
            NearToken::from_yoctonear(30_000_000_000_000_000_000_000_000), // 30 NEAR
        );
        testing_env!(ctx_owner.build());
        let res = std::panic::catch_unwind(AssertUnwindSafe(|| contract.withdraw()));
        assert!(res.is_ok());
    }

}
