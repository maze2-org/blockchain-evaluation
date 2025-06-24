#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod iabs_token {
    use ink::storage::Mapping;

    #[ink(storage)]
    pub struct IabsToken {
        /// Total token supply.
        total_supply: Balance,
        /// Mapping from owner to number of owned tokens.
        balances: Mapping<AccountId, Balance>,
        /// The contract owner (who can withdraw funds).
        owner: AccountId,
        /// Minimum payment required to mint tokens (0.01 SBY)
        min_payment: Balance,
        /// Amount of tokens minted per payment (1000 IABS)
        mint_amount: Balance,
    }

    #[ink(event)]
    pub struct Mint {
        #[ink(topic)]
        to: AccountId,
        amount: Balance,
        payment: Balance,
    }

    #[ink(event)]
    pub struct Withdraw {
        #[ink(topic)]
        owner: AccountId,
        amount: Balance,
    }

    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum Error {
        InsufficientBalance,
        NotOwner,
        InsufficientPayment,
        NoFundsToWithdraw,
        TransferFailed,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    impl IabsToken {
        #[ink(constructor)]
        pub fn new() -> Self {
            let caller = Self::env().caller();

            Self {
                total_supply: 0,
                balances: Mapping::default(),
                owner: caller,
                min_payment: 10_000_000_000_000_000, // 0.01 SBY
                mint_amount: 1_000_000_000_000_000_000_000, // 1000 tokens with 18 decimals
            }
        }

        #[ink(message, payable)]
        pub fn mint(&mut self) -> Result<()> {
            let caller = self.env().caller();
            let payment = self.env().transferred_value();

            if payment < self.min_payment {
                return Err(Error::InsufficientPayment);
            }

            let current_balance = self.balance_of(caller);
            let new_balance = current_balance.saturating_add(self.mint_amount);

            self.balances.insert(caller, &new_balance);
            self.total_supply = self.total_supply.saturating_add(self.mint_amount);

            self.env().emit_event(Mint {
                to: caller,
                amount: self.mint_amount,
                payment,
            });

            Ok(())
        }

        #[ink(message)]
        pub fn withdraw(&mut self) -> Result<()> {
            let caller = self.env().caller();

            if caller != self.owner {
                return Err(Error::NotOwner);
            }

            let balance = self.env().balance();
            let minimum_balance = self.env().minimum_balance();

            if balance <= minimum_balance {
                return Err(Error::NoFundsToWithdraw);
            }

            let withdraw_amount = balance.saturating_sub(minimum_balance);

            if withdraw_amount == 0 {
                return Err(Error::NoFundsToWithdraw);
            }

            // Use match instead of is_err() for better error handling
            match self.env().transfer(self.owner, withdraw_amount) {
                Ok(_) => {
                    self.env().emit_event(Withdraw {
                        owner: self.owner,
                        amount: withdraw_amount,
                    });
                    Ok(())
                }
                Err(_) => Err(Error::TransferFailed),
            }
        }

        #[ink(message)]
        pub fn balance_of(&self, owner: AccountId) -> Balance {
            self.balances.get(owner).unwrap_or_default()
        }

        #[ink(message)]
        pub fn total_supply(&self) -> Balance {
            self.total_supply
        }

        #[ink(message)]
        pub fn owner(&self) -> AccountId {
            self.owner
        }

        #[ink(message)]
        pub fn min_payment(&self) -> Balance {
            self.min_payment
        }

        #[ink(message)]
        pub fn mint_amount(&self) -> Balance {
            self.mint_amount
        }

        #[ink(message)]
        pub fn contract_balance(&self) -> Balance {
            self.env().balance()
        }

        /// Allow owner to update minimum payment
        #[ink(message)]
        pub fn set_min_payment(&mut self, new_min_payment: Balance) -> Result<()> {
            let caller = self.env().caller();

            if caller != self.owner {
                return Err(Error::NotOwner);
            }

            self.min_payment = new_min_payment;
            Ok(())
        }

        /// Allow owner to update mint amount
        #[ink(message)]
        pub fn set_mint_amount(&mut self, new_mint_amount: Balance) -> Result<()> {
            let caller = self.env().caller();

            if caller != self.owner {
                return Err(Error::NotOwner);
            }

            self.mint_amount = new_mint_amount;
            Ok(())
        }

        /// Transfer ownership to a new owner
        #[ink(message)]
        pub fn transfer_ownership(&mut self, new_owner: AccountId) -> Result<()> {
            let caller = self.env().caller();

            if caller != self.owner {
                return Err(Error::NotOwner);
            }

            self.owner = new_owner;
            Ok(())
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn new_works() {
            let contract = IabsToken::new();
            assert_eq!(contract.total_supply(), 0);
            assert_eq!(contract.min_payment(), 10_000_000_000_000_000);
            assert_eq!(contract.mint_amount(), 1_000_000_000_000_000_000_000);
        }

        #[ink::test]
        fn balance_of_works() {
            let contract = IabsToken::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            assert_eq!(contract.balance_of(accounts.alice), 0);
        }
    }
}
