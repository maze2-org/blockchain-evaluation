/// IABS Token - A simple token minting contract for Sui blockchain evaluation
/// 
/// This contract allows users to mint IABS tokens by sending SUI.
/// - Send 0.01 SUI to mint 1,000 IABS tokens
/// - Only the contract owner can withdraw collected SUI
/// - Implements basic token functionality with Move's object model
module iabs_token::iabs {
    use sui::balance;
    use sui::coin;
    use sui::sui::SUI;
    use sui::event;

    /// Error codes
    const EInsufficientPayment: u64 = 0;
    const ENotOwner: u64 = 1;
    const EInsufficientBalance: u64 = 2;

    /// Minimum payment required to mint tokens (0.01 SUI)
    const MIN_PAYMENT: u64 = 10_000_000; // 0.01 SUI in MIST (1 SUI = 1_000_000_000 MIST)

    /// Amount of tokens minted per successful payment
    const MINT_AMOUNT: u64 = 1000;

    /// The IABS token struct - represents the token capability
    public struct IABS has drop {}

    /// Treasury capability - held by the contract owner
    public struct TreasuryCap has key, store {
        id: object::UID,
        total_supply: u64,
    }

    /// Contract state - holds the collected SUI and metadata
    public struct TokenContract has key {
        id: object::UID,
        owner: address,
        balance: balance::Balance<SUI>,
        total_minted: u64,
    }

    /// Individual IABS token balance object
    public struct IABSBalance has key, store {
        id: object::UID,
        balance: u64,
    }

    /// Events
    public struct TokensMinted has copy, drop {
        recipient: address,
        amount: u64,
        payment: u64,
    }

    public struct FundsWithdrawn has copy, drop {
        owner: address,
        amount: u64,
    }

    public struct Transfer has copy, drop {
        from: address,
        to: address,
        amount: u64,
    }

    /// Initialize the contract - called once during deployment
    fun init(_witness: IABS, ctx: &mut tx_context::TxContext) {
        let treasury_cap = TreasuryCap {
            id: object::new(ctx),
            total_supply: 0,
        };

        let contract = TokenContract {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            balance: balance::zero<SUI>(),
            total_minted: 0,
        };

        transfer::transfer(treasury_cap, tx_context::sender(ctx));
        transfer::share_object(contract);
    }

    /// Mint IABS tokens by sending SUI
    public entry fun mint(
        contract: &mut TokenContract,
        payment: coin::Coin<SUI>,
        ctx: &mut tx_context::TxContext
    ) {
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= MIN_PAYMENT, EInsufficientPayment);

        let sender = tx_context::sender(ctx);
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut contract.balance, payment_balance);
        contract.total_minted = contract.total_minted + MINT_AMOUNT;

        let iabs_balance = IABSBalance {
            id: object::new(ctx),
            balance: MINT_AMOUNT,
        };

        transfer::transfer(iabs_balance, sender);

        event::emit(TokensMinted {
            recipient: sender,
            amount: MINT_AMOUNT,
            payment: payment_amount,
        });
    }

    /// Withdraw collected SUI (owner only)
    public entry fun withdraw(
        contract: &mut TokenContract,
        ctx: &mut tx_context::TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == contract.owner, ENotOwner);

        let withdraw_amount = balance::value(&contract.balance);
        assert!(withdraw_amount > 0, EInsufficientBalance);

        let withdrawn_balance = balance::withdraw_all(&mut contract.balance);
        let withdrawn_coin = coin::from_balance(withdrawn_balance, ctx);

        transfer::public_transfer(withdrawn_coin, sender);

        event::emit(FundsWithdrawn {
            owner: sender,
            amount: withdraw_amount,
        });
    }

    /// Transfer IABS tokens between users
    public entry fun transfer_tokens(
        from_balance: &mut IABSBalance,
        amount: u64,
        recipient: address,
        ctx: &mut tx_context::TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(from_balance.balance >= amount, EInsufficientBalance);

        from_balance.balance = from_balance.balance - amount;

        let recipient_balance = IABSBalance {
            id: object::new(ctx),
            balance: amount,
        };

        transfer::transfer(recipient_balance, recipient);

        event::emit(Transfer {
            from: sender,
            to: recipient,
            amount,
        });
    }

    /// Merge two IABS balance objects
    public entry fun merge_balances(
        balance1: &mut IABSBalance,
        balance2: IABSBalance,
    ) {
        let IABSBalance { id, balance } = balance2;
        object::delete(id);
        balance1.balance = balance1.balance + balance;
    }

    /// Query functions
    public fun balance_amount(balance: &IABSBalance): u64 {
        balance.balance
    }

    public fun contract_owner(contract: &TokenContract): address {
        contract.owner
    }

    public fun contract_balance(contract: &TokenContract): u64 {
        balance::value(&contract.balance)
    }

    public fun total_minted(contract: &TokenContract): u64 {
        contract.total_minted
    }

    public fun min_payment(): u64 {
        MIN_PAYMENT
    }

    public fun mint_amount(): u64 {
        MINT_AMOUNT
    }

    /// Test functions
    #[test_only]
    use sui::test_scenario;
    #[test_only]
    use sui::coin::mint_for_testing;

    #[test_only]
    fun init_for_testing(ctx: &mut tx_context::TxContext) {
        init(IABS {}, ctx);
    }

    #[test]
    fun test_init() {
        let owner = @0xA;
        let mut scenario = test_scenario::begin(owner);

        {
            let ctx = test_scenario::ctx(&mut scenario);
            init_for_testing(ctx);
        };

        test_scenario::next_tx(&mut scenario, owner);

        {
            assert!(test_scenario::has_most_recent_for_sender<TreasuryCap>(&scenario), 0);
            assert!(test_scenario::has_most_recent_shared<TokenContract>(), 1);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_mint() {
        let owner = @0xA;
        let user = @0xB;
        let mut scenario = test_scenario::begin(owner);

        {
            let ctx = test_scenario::ctx(&mut scenario);
            init_for_testing(ctx);
        };

        test_scenario::next_tx(&mut scenario, user);

        {
            let mut contract = test_scenario::take_shared<TokenContract>(&scenario);
            let payment = mint_for_testing<SUI>(MIN_PAYMENT, test_scenario::ctx(&mut scenario));

            mint(&mut contract, payment, test_scenario::ctx(&mut scenario));

            test_scenario::return_shared(contract);
        };

        test_scenario::next_tx(&mut scenario, user);

        {
            assert!(test_scenario::has_most_recent_for_sender<IABSBalance>(&scenario), 0);

            let balance = test_scenario::take_from_sender<IABSBalance>(&scenario);
            assert!(balance_amount(&balance) == MINT_AMOUNT, 1);

            test_scenario::return_to_sender(&scenario, balance);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = EInsufficientPayment)]
    fun test_mint_insufficient_payment() {
        let owner = @0xA;
        let user = @0xB;
        let mut scenario = test_scenario::begin(owner);

        {
            let ctx = test_scenario::ctx(&mut scenario);
            init_for_testing(ctx);
        };

        test_scenario::next_tx(&mut scenario, user);

        {
            let mut contract = test_scenario::take_shared<TokenContract>(&scenario);
            let payment = mint_for_testing<SUI>(MIN_PAYMENT - 1, test_scenario::ctx(&mut scenario));

            mint(&mut contract, payment, test_scenario::ctx(&mut scenario));

            test_scenario::return_shared(contract);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_withdraw() {
        let owner = @0xA;
        let user = @0xB;
        let mut scenario = test_scenario::begin(owner);

        {
            let ctx = test_scenario::ctx(&mut scenario);
            init_for_testing(ctx);
        };

        test_scenario::next_tx(&mut scenario, user);
        {
            let mut contract = test_scenario::take_shared<TokenContract>(&scenario);
            let payment = mint_for_testing<SUI>(MIN_PAYMENT, test_scenario::ctx(&mut scenario));

            mint(&mut contract, payment, test_scenario::ctx(&mut scenario));

            test_scenario::return_shared(contract);
        };

        test_scenario::next_tx(&mut scenario, owner);
        {
            let mut contract = test_scenario::take_shared<TokenContract>(&scenario);

            withdraw(&mut contract, test_scenario::ctx(&mut scenario));

            test_scenario::return_shared(contract);
        };

        test_scenario::next_tx(&mut scenario, owner);
        {
            assert!(test_scenario::has_most_recent_for_sender<coin::Coin<SUI>>(&scenario), 0);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = ENotOwner)]
    fun test_withdraw_not_owner() {
        let owner = @0xA;
        let user = @0xB;
        let mut scenario = test_scenario::begin(owner);

        {
            let ctx = test_scenario::ctx(&mut scenario);
            init_for_testing(ctx);
        };

        test_scenario::next_tx(&mut scenario, user);
        {
            let mut contract = test_scenario::take_shared<TokenContract>(&scenario);
            withdraw(&mut contract, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(contract);
        };

        test_scenario::end(scenario);
    }
}
