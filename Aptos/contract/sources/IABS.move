module deployer::IABS {
    use std::signer;
    use std::string;
    use aptos_framework::coin::{Self, MintCapability, BurnCapability};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event;

    /// Error codes
    const E_NOT_OWNER: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    const E_INVALID_AMOUNT: u64 = 3;

    /// IABS token struct
    struct IABS {}

    /// Resource to store mint and burn capabilities
    struct Capabilities has key {
        mint_cap: MintCapability<IABS>,
        burn_cap: BurnCapability<IABS>,
    }

    /// Contract state
    struct ContractState has key {
        owner: address,
        total_supply: u64,
        apt_balance: u64,
    }

    #[event]
    struct MintEvent has drop, store {
        minter: address,
        amount: u64,
        apt_paid: u64,
    }

    #[event]
    struct WithdrawEvent has drop, store {
        owner: address,
        amount: u64,
    }

    /// Initialize the IABS token
    fun init_module(deployer: &signer) {
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<IABS>(
            deployer,
            string::utf8(b"IABS Token"),
            string::utf8(b"IABS"),
            8, // decimals
            true, // monitor_supply
        );

        // Store capabilities
        move_to(deployer, Capabilities {
            mint_cap,
            burn_cap,
        });

        // Store contract state
        move_to(deployer, ContractState {
            owner: signer::address_of(deployer),
            total_supply: 0,
            apt_balance: 0,
        });

        // Destroy freeze capability as we don't need it
        coin::destroy_freeze_cap(freeze_cap);
    }

    /// Mint IABS tokens for APT
    /// User pays 0.01 APT (1,000,000 octas) to receive 1000 IABS tokens
    public entry fun mint(user: &signer, apt_amount: u64) acquires Capabilities, ContractState {
        let user_addr = signer::address_of(user);

        // Check if user sent exactly 0.01 APT (1,000,000 octas)
        assert!(apt_amount == 1000000, E_INVALID_AMOUNT);

        // Transfer APT from user to contract
        let apt_coins = coin::withdraw<AptosCoin>(user, apt_amount);
        let contract_state = borrow_global_mut<ContractState>(@deployer);
        contract_state.apt_balance = contract_state.apt_balance + apt_amount;

        // Store APT coins in the contract (we'll handle this by keeping track in state)
        coin::deposit(@deployer, apt_coins);

        // Mint 1000 IABS tokens (100,000,000,000 with 8 decimals)
        let iabs_amount = 100000000000; // 1000 * 10^8
        let capabilities = borrow_global<Capabilities>(@deployer);
        let iabs_coins = coin::mint(iabs_amount, &capabilities.mint_cap);

        // Update total supply
        contract_state.total_supply = contract_state.total_supply + iabs_amount;

        // Deposit IABS tokens to user
        coin::deposit(user_addr, iabs_coins);

        // Emit mint event
        event::emit(MintEvent {
            minter: user_addr,
            amount: iabs_amount,
            apt_paid: apt_amount,
        });
    }

    /// Withdraw APT from contract (owner only)
    public entry fun withdraw(owner: &signer, amount: u64) acquires ContractState {
        let owner_addr = signer::address_of(owner);
        let contract_state = borrow_global_mut<ContractState>(@deployer);

        // Check if caller is owner
        assert!(owner_addr == contract_state.owner, E_NOT_OWNER);

        // Check if contract has sufficient balance
        assert!(contract_state.apt_balance >= amount, E_INSUFFICIENT_BALANCE);

        // Update contract balance
        contract_state.apt_balance = contract_state.apt_balance - amount;

        // Transfer APT from contract's tracked balance to owner
        // Note: In a production contract, this would use a resource account
        // For this demo, we'll just update the tracked balance
        // The actual APT remains in the contract account

        // Emit withdraw event
        event::emit(WithdrawEvent {
            owner: owner_addr,
            amount,
        });
    }

    #[view]
    public fun get_total_supply(): u64 acquires ContractState {
        borrow_global<ContractState>(@deployer).total_supply
    }

    #[view]
    public fun get_contract_balance(): u64 acquires ContractState {
        borrow_global<ContractState>(@deployer).apt_balance
    }

    #[view]
    public fun get_owner(): address acquires ContractState {
        borrow_global<ContractState>(@deployer).owner
    }

    #[view]
    public fun get_user_balance(user_addr: address): u64 {
        coin::balance<IABS>(user_addr)
    }
}
