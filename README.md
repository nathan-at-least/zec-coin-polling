# coin-polling

This repository contains tooling for running `T-Addr Balance Weighted Zcash Polls`. This is the kind of polling performed during the Zcash Dev Fund Debate.

## Protocol

This protocol allows ZEC holders to weigh in with a ballot where their vote is weighted by an amount of ZEC posted. The voter's preferences are recorded in a Zcash Shielded Memo sent to a poll-associated `vote reception address`, which is a shielded Z-Address. A participant voter holds `voting ZEC` in a Transparent Address, called the `voting address`, up until a poll cut-off height. At the pre-defined cut-off height, a snapshot of the posted balances in Transparent Addresses associated with the poll is used to calculate the poll results.

Typically, the Viewing Key of the `vote reception address`, or more concisely the `vote reception viewing key`, is publicly available. Anyone with the `vote reception viewing key` for a poll can tally the same results to verify them.

### Pollster Process

A `pollster` is anyone who wants to conduct a `T-Addr Balance Weighted Zcash Poll`. The process to do this is as follows:

1. The `pollster` should ensure they understand the [Issues and Concerns](#issues-and-concerns) section below before deciding to conduct this kind of poll.
2. Define a `ballot definition` with specific questions and answers (see the [Ballot Definition](#ballot-definition) section below).
3. Define a `cut-off height` which concludes the voting period.
4. Set up a `vote reception address` specific to this poll. (It is recommended to use a new single-use address for this purpose.)
5. Announce the poll with the `ballot definition`, the `cut-off height`, and the `vote reception address` to ZEC users. Typically this announcement should also include the `vote reception viewing key` so that everyone can directly verify the results.
6. After the `cut-off height`, produce the `poll results`.

This repository contains tools to help with this process.

### Voter Process

A `voter` is any participant that wants to weigh in on any `T-Addr Balance Weighted Zcash Poll`. If you want to participate as a voter in a poll, your process is presented here. Note that this process follows the guidelines presented in the user advice sections under [Issues and Concerns](#issues-and-concerns) below.

1. First you should ensure you understand the [Issues and Concerns](#issues-and-concerns) section below before deciding to participate in the poll.
2. Read the `ballot definition` and decide on your preferences.
3. Create a new unique Transparent `voting address` using your shielded favorite wallet.
4. Transfer 0.0001 ZEC from your own Shielded Address to your new `voting address`.
5. Encode your vote preferences into a `vote cast memo`. This is a specific format (described below in [Vote Cast Memo Format](#vote-cast-memo-format)) and is specific to the `ballot definition`. You can use the `memo-maker` tool in this repository to simplify this step, see [Vote Cast Memo Maker](#vote-cast-memo-maker) section below.
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

A `Ballot Definition` presents a set of questions and possible responses. Voters must encode their responses to each question into a memo in a specific format to enable consistent automated tallying of results. Doing this manually can be tedious for both the pollster and voters, so this repository introduces a well-defined [Ballot Definition Format](#ballot-definition-format) and an associated [Vote Cast Memo Format](#vote-cast-memo-format) as well as tools for pollsters and voters to use these formats.

### Ballot Definition Format

The `ballot definition format` introduced here represents ballots as a specific JSON structure:

```json
{
  "zec-coin-polling-ballot": "v1",
  "cut-off-height": <block height>,
  "vote-reception-address": <vote reception z address>,
  "vote-reception-viewing-key": <vote reception viewing key>,
  "poll-questions": [
    {
      "question": <question text>,
      "other-prompt": <other response prompt or `null` if open-ended responses aren't allowed>,
      "fixed-responses": [
        <response text>,
        …
      ]
    },
    …
  ]
}
```

**Field definitions:**

- `zec-coin-polling-ballot`: Defines the version of this standard, which currently must be `"v1"`.
- `cut-off-height`: The block height at which the poll results snapshot is taken. This is the end of the poll, after which users may reclaim their `posted ZEC`.
- `vote-reception-address`: The `vote reception Z-Address` for this poll.
- `vote-reception-viewing-key`: The `vote reception Viewing Key` for this poll. This format always requires this to be published in the poll definition.
- `poll-questions`: A list of poll question entries. There must be at least one entry. Each one has the following fields:

  - `question`: A poll question. This format currently only supports single-language polls.
  - `other-prompt`: If this is `null`, then only the fixed responses in `responses` are supported. Otherwise this is a prompt for an open ended response, for example `"Other, please specify:"`. When this prompt is specified, it appears as the last response option with an open-ended text response field for the voter.
  - `fixed-responses`: A list of fixed response texts. These do not need ordinal indicators, because the `zec-coin-polling` tool system applies upper-case `A`-`Z` labels automatically based on the order of responses in this list. For example, `[ "red", "green", "blue" ]` could be the `responses` list for the question `"What is your favorite primary color?"`. There is no need to add an "abstain" response, because a voter can always implicitly abstain from any question and the [Vote Cast Memo Format](#vote-cast-memo-format) facilitates abstentions.

### Vote Cast Memo Format

A user encodes their vote preferences for a poll into a Zcash encrypted memo sent to the `vote reception Z-Address`. The encoding of this vote is a JSON structure with the following format:

```json
{
  "zec-coin-polling-vote": "v1",
  "poll-hash": <hex encoded sha256 of the ballot definition JSON>,
  "votes": [
    <vote entry>,
    …
  ]
}
```

**Strictness Rule:** This standard applies a consistent `strictness rule`: whenever an encoded `vote cast memo` does not follow all of the rules of this standard, then the _entire_ vote is ignored and treated identically to as if every response is "abstain". The rationale for this strictness is to limit any potential for confusion by pollsters, voters, or results aggregators from participating in a poll. This strictness would be cumbersome if users are directly editing poll definitions or vote cast memos, and we assume they will use software tools that can follow this strictness without burdening the user.

**Field definitions:**

- `zec-coin-polling-vote`: Defines the version of this standard, which currently must be `"v1"`.
- `poll-hash`: This is a hex encoding of the SHA256 hash of the [Ballot Definition Format](#ballot-definition-format). This ensures that a voters preferences can not be mistakenly applied to the wrong ballot, including if a pollster changes the ballot definition after a voter encodes their preferences. If it does not match, the vote is rejected by the `strictness rule`, and participants should carefully scrutinize why there is a mismatch, which could be due to: multiple legimate revisions of the poll definition, someone confusing a voter (intentionally or not), or a malicious voter attempting to disrupt or confuse the poll results.
- `votes`: This list should be the same length as the ballot definitions `poll-questions` list, or else the vote is rejected by the `strictness rule`. Each `<vote entry>` corresponds to the poll definition question at the same index, and must take one of the following forms:

  - `null` - This indicates the voter abstains from the associated question.
  - `<number>` - A valid 0-based index for the `fixed-responses` list for the associated question. If this number is not an integer, less than 0, or equal to or larger than the number of `fixed-responses`, then this vote cast memo is rejected due to the `strictness rule`.
  - `<string>` - If the associated entry in `poll-questions` has an `other-prompt` field that is not null, then this vote entry constitutes a free-form response to the question. If the `other-prompt` is `null`, then this vote cast memo is rejected due to the `strictness rule`.
  - Any other value causes the vote cast memo to be rejected due to the `strictness rule`.

**Encoding Issues:** The encoded `vote cast memo` must fit into a single Zcash encrypted memo. This means large polls or votes with long free-form answers may be too long to successfully use this system.

## Tools

This repository contains some tools to support Zcash coin polling with the mechanism described above.

**TODO:** Make these tool and test them.

### Poll Definition Tool

The `Poll Definition Tool` is a self-contained serverless html directory which when opened in a browser allows a pollster to define a poll. When a pollster is satisfied with their edits, it generates a [Ballot Definition Format](#ballot-definition-format) JSON file which the pollster can download. The pollster can then use this JSON file to create a [Vote Cast Memo Maker](#vote-cast-memo-maker) instance for their poll.

### Vote Cast Memo Maker

The `Vote Cast Memo Maker` is a self-contained serverless html directory which when opened in a browser allows a voter to specify their vote preferences for the associated ballot. When they are satisfied with their response, it generates a memo text field that they can cut'n'paste into a wallet to submit their vote.

#### Deployment and Safe Usage

The `Vote Cast Memo Maker` needs a specific [Ballot Definition Format](#ballot-definition-format) JSON file to create an `instance`, which is a directory with the memo maker html *and* the ballot definition JSON file.

All of the logic for generating the encoded memo is browser-side with no transmission of a user's preferences away from their local browser, so for users who trust that a specific web server is not malicious, they can use a hosted instance of the memo maker for a particular ballot. *However*, it is trivial for the website operator or network attacker to modify the memo maker HTML to transmit a user's preferences, thereby violating their privacy.

**Privacy Concern:** Users who do not accept the risk of a malicious hosted memo maker instance may want to create their own instance of the memo maker from the ballot definition JSON on their local machine, and then open the `index.html` file from their hard-drive with their browser. This helps ensure their voting preferences are never sent across the network.
