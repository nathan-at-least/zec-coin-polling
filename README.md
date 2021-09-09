# coin-polling

This repository contains tooling for running `T-Addr Balance Weighted Zcash Polls`. This is the kind of polling performed during the Zcash Dev Fund Debate.

## Protocol

This protocol allows ZEC holders to weigh in with a ballot where their vote is weighted by an amount of ZEC posted. The voter's preferences are recorded in a Zcash Shielded Memo sent to a poll-associated `vote reception address`, which is a shielded Z-Address. A participant voter holds `voting ZEC` in a Transparent Address, called the `voting address`, up until a poll cut-off height. At the pre-defined cut-off height, a snapshot of the posted balances in Transparent Addresses associated with the poll is used to calculate the poll results.

Typically, the Viewing Key of the `vote reception address`, or more concisely the `vote reception viewing key`, is publicly available. Anyone with the `vote reception viewing key` for a poll can tally the same results to verify them.

### Pollster Process

A `pollster` is anyone who wants to conduct a `T-Addr Balance Weighted Zcash Poll`. The process to do this is as follows:

1. The `pollster` should ensure they understand the [Issues and Concerns]() section below before deciding to conduct this kind of poll.
2. Define a `ballot definition` with specific questions and answers (see the [Ballot Definition]() section below).
3. Define a `cut-off height` which concludes the voting period.
4. Set up a `vote reception address` specific to this poll. (It is recommended to use a new single-use address for this purpose.)
5. Announce the poll with the `ballot definition`, the `cut-off height`, and the `vote reception address` to ZEC users. Typically this announcement should also include the `vote reception viewing key` so that everyone can directly verify the results.
6. After the `cut-off height`, produce the `poll results`.

This repository contains tools to help with this process.

### Voter Process

A `voter` is any participant that wants to weigh in on any `T-Addr Balance Weighted Zcash Poll`. If you want to participate as a voter in a poll, your process is presented here. Note that this process follows the guidelines presented in the user advice sections under [Issues and Concerns]() below.

1. First you should ensure you understand the [Issues and Concerns]() section below before deciding to participate in the poll.
2. Read the `ballot definition` and decide on your preferences.
3. Create a new unique Transparent `voting address` using your shielded favorite wallet.
4. Transfer 0.0001 ZEC from your own Shielded Address to your new `voting address`.
5. Encode your vote preferences into a `vote cast memo`. This is a specific format (described below in [Vote Cast Memo Format]()) and is specific to the `ballot definition`. You can use the `memo-maker` tool in this repository to simplify this step, see [Vote Cast Memo Maker]() section below.
6. Send 0 ZEC from your `voting address` to the `vote reception address` with their encoded `vote cast memo`. (You will still need to pay the network transaction fee for this step.)
7. Decide how much ZEC to contribute as your `voting ZEC` towards the poll.
8. Send your `voting ZEC` amount to *your own* Transparent `voting address`. **IMPORTANT:** Do *NOT* send your `voting ZEC` to the shielded `vote reception address` as this will transfer your ZEC to the pollster rather than post it for the poll. If you are sending from a shielded address, there is no way for the pollster to know where it came from, which makes safe refunds impossible.
9. Wait until the `cut-off height` has passed.
10. Transfer your `voting ZEC` from your `voting address` back to your normal shielded address. It is now fully available to you again.

### Issues and Concerns

#### Privacy Concerns

Because the polling weight is determined by Transparent Address balances, this ZEC amount is publicly visible on-chain. Additionally, the voting preferences associated with each Transparent Address are revealed to anyone with the `vote reception viewing key`. In most use cases, this is publicly available.

This has the following implications for voting participants in polls using this protocol:

- The history of the `voting address` is publicly visible on-chain.
- The amount posted for weight in the poll is publicly visible on-chain.
- The voting preference of each voting address is known to anyone with the `vote reception viewing key`.

##### User Advice Around Privacy Concerns

Given the above implications around privacy, we give the following advice to users who have decided to participate in a `T-Addr Balance Weighted Zcash Poll`:

- The user must accept the risk of associating their voting preference with their `posted ZEC` amount.
- Use a unique, new T-Address with no history for each poll.
- Send the `voting ZEC` to this unique T-Address from a shielded address to remove any other transaction history from the vote participation. Note that transferring ZEC from a T-Address through a Z-Address and then into a Transparent `voting address` does not adequately unlink the participants transaction history from their vote. Only ZEC held in a Z-Address prior to participating in a poll has strong historical privacy.

Users who aren't comfortable with these risks should not participate in this kind of poll. Hopefully in the future, voting protocols with better privacy properties will be available on Zcash.

#### Usability Concerns

Common shielded wallets, such as [Zecwallet](https://www.zecwallet.co/) automatically move funds out of Transparent Addresses and into Shielded Z-Addresses whenever issuing transactions to improve the ease of using Zcash privately. Because of this, the best process for voting in this polling scheme using these kinds of wallets is to post your vote preferences first, and then move your funds into your destination `voting address`. Furthermore, if you issue a new transaction with this kind of wallet, it may reshield your `voting ZEC`.

Wallets with "auto-shielding" may be even more aggressive about moving your `voting ZEC` out of the `voting address`.

These features are very beneficial for making shielded privacy more usable with Zcash, so future polling protocols which have better privacy and work well with these wallet behaviors need to be designed to replace this scheme.

## Ballot Definition

**TODO:** Complete this section.

### Vote Cast Memo Format

**TODO:** Complete this section.

#### Vote Cast Memo Maker

**TODO:** Complete this section.

**TODO:** Make the tool and test it.
