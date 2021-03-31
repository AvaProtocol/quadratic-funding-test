### Deploy local chain

1. clone the repo: `git clone https://github.com/OAK-Foundation/substrate-node-template.git`
2. git checkout grant_round branch: `git checkout grant_round`
3. build with `cargo build --release`
4. start two nodes(Alice and Bob):

	```
	// Start Alice node:
	./target/release/node-template \                                                     
	--chain ./customSpecRaw.json \
	--alice \
  	--port 30333 \
  	--ws-port 9945 \
  	--rpc-port 9933 \
  	--node-key 0000000000000000000000000000000000000000000000000000000000000001 \
  	--validator \
	--tmp
	
	// Bob join to Alice node
	// 12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp is Alice node identity
	./target/release/node-template \
	--chain customSpecRaw.json \
  	--bob \
  	--port 30334 \
  	--ws-port 9946 \
  	--rpc-port 9934 \
  	--validator \
  	--bootnodes /ip4/127.0.0.1/tcp/30333/p2p/12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp \
	--tmp
	```

### How to test

1. Install dependencies: `yarn`
2. Run all test cases: `npm test`
3. Run all Unit Test cases: `npm test unit`
4. Run all Functional Test cases: `npm test functional`