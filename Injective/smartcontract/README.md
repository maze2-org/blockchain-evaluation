# IABS Token Contract

A CosmWasm smart contract implementing a fungible token (IABS) with minting functionality.

## Contract Features

- Fungible token named "IABS" with 6 decimal places
- Users can mint 1,000 IABS tokens by sending 0.01 native token
- Owner-only withdrawal of collected native tokens
- Queryable balance, total supply, and collected funds

## Usage

### Instantiation

```json
{
    "msg": "instantiate",
    "funds": []
}
```

### Minting

Users can mint 1,000 IABS tokens by sending 0.01 native token:

```json
{
    "msg": "mint",
    "funds": ["amount": "10000000", "denom": "native_token"]
}
```

### Withdrawal (Owner Only)

Contract owner can withdraw all collected native tokens:

```json
{
    "msg": "withdraw",
    "funds": []
}
```

### Queries

Available queries:

- `GetBalance`: Get user's token balance
- `GetTotalSupply`: Get total supply of IABS tokens
- `GetCollectedFunds`: Get amount of native tokens collected through minting

## Security

- Only contract owner can withdraw collected native tokens
- Minting requires exact amount of native tokens (0.01)
- All state changes are properly tracked and persisted

## Development

For development instructions, see [Developing.md](./Developing.md).

## Creating a new repo from template

Assuming you have a recent version of rust and cargo (v1.58.1+) installed
(via [rustup](https://rustup.rs/)),
then the following should get you a new repo to start a contract:

Install [cargo-generate](https://github.com/ashleygwilliams/cargo-generate) and cargo-run-script.
Unless you did that before, run this line now:

```sh
cargo install cargo-generate --features vendored-openssl
cargo install cargo-run-script
```

Now, use it to create your new contract.
Go to the folder in which you want to place it and run:


**Latest: 1.0.0-beta6**

```sh
cargo generate --git https://github.com/CosmWasm/cw-template.git --name PROJECT_NAME
````

**Older Version**

Pass version as branch flag:

```sh
cargo generate --git https://github.com/CosmWasm/cw-template.git --branch <version> --name PROJECT_NAME
````

Example:

```sh
cargo generate --git https://github.com/CosmWasm/cw-template.git --branch 0.16 --name PROJECT_NAME
```

You will now have a new folder called `PROJECT_NAME` (I hope you changed that to something else)
containing a simple working contract and build system that you can customize.

## Create a Repo

After generating, you have a initialized local git repo, but no commits, and no remote.
Go to a server (eg. github) and create a new upstream repo (called `YOUR-GIT-URL` below).
Then run the following:

```sh
# this is needed to create a valid Cargo.lock file (see below)
cargo check
git branch -M main
git add .
git commit -m 'Initial Commit'
git remote add origin YOUR-GIT-URL
git push -u origin main
```

## CI Support

We have template configurations for both [GitHub Actions](.github/workflows/Basic.yml)
and [Circle CI](.circleci/config.yml) in the generated project, so you can
get up and running with CI right away.

One note is that the CI runs all `cargo` commands
with `--locked` to ensure it uses the exact same versions as you have locally. This also means
you must have an up-to-date `Cargo.lock` file, which is not auto-generated.
The first time you set up the project (or after adding any dep), you should ensure the
`Cargo.lock` file is updated, so the CI will test properly. This can be done simply by
running `cargo check` or `cargo unit-test`.

## Using your project

Once you have your custom repo, you should check out [Developing](./Developing.md) to explain
more on how to run tests and develop code. Or go through the
[online tutorial](https://docs.cosmwasm.com/) to get a better feel
of how to develop.

[Publishing](./Publishing.md) contains useful information on how to publish your contract
to the world, once you are ready to deploy it on a running blockchain. And
[Importing](./Importing.md) contains information about pulling in other contracts or crates
that have been published.

Please replace this README file with information about your specific project. You can keep
the `Developing.md` and `Publishing.md` files as useful referenced, but please set some
proper description in the README.

## Gitpod integration

[Gitpod](https://www.gitpod.io/) container-based development platform will be enabled on your project by default.

Workspace contains:
 - **rust**: for builds
 - [wasmd](https://github.com/CosmWasm/wasmd): for local node setup and client
 - **jq**: shell JSON manipulation tool

Follow [Gitpod Getting Started](https://www.gitpod.io/docs/getting-started) and launch your workspace.

