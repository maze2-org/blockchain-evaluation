use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};
use solana_program::{pubkey, pubkey::Pubkey};

declare_id!("Eu8NveMwqqQK8WEUBDSqht6WaoJeZHLYVnWcNHLnU5ks");

pub const OWNER_PUBKEY: Pubkey = pubkey!("8JRvQsFosWxtDyKspCKngbPtZCUst2zhmRhtsqygcTAh");

#[program]
pub mod iabs_minter {
    use super::*;

    pub fn mint(ctx: Context<MintToken>) -> Result<()> {
        // Transfert de 0.01 SOL vers la vault
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.payer.key(),
            &ctx.accounts.vault.key(),
            10_000_000, // 0.01 SOL
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.vault.to_account_info(),
            ],
        )?;

        // Mint des tokens (1000 * 10^6 si 6 décimales)
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
        );
        token::mint_to(cpi_ctx, 1_000_000_000)?;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        let balance = ctx.accounts.vault.lamports();
        **ctx
            .accounts
            .vault
            .to_account_info()
            .try_borrow_mut_lamports()? -= balance;
        **ctx
            .accounts
            .owner
            .to_account_info()
            .try_borrow_mut_lamports()? += balance;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct MintToken<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub token_account: Account<'info, anchor_spl::token::TokenAccount>,

    #[account(
        seeds = [b"authority"],
        bump
    )]
    /// CHECK: PDA mint authority
    pub mint_authority: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"vault"],
        bump
    )]
    /// CHECK: PDA vault that receives SOL
    pub vault: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(address = OWNER_PUBKEY)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault"],
        bump
    )]
    /// CHECK: vault that stores SOL
    pub vault: AccountInfo<'info>,
}
