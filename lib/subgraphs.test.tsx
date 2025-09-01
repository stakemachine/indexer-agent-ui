import { describe, expect, it } from "vitest";
import { SubgraphDeploymentID, SubgraphName } from "@/lib/subgraphs";

describe("lib/subgraphs", () => {
  // Generate valid test cases using actual conversion logic
  const validBytes32Values = [
    "0x7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89",
    "0x9c06ef17d7332e3681b7a615bfc45557fe2d2eb464d6ff0a5fb4ad56183e5045",
  ];

  // Create test cases by generating IPFS hashes from valid bytes32 values
  const validTestCases = validBytes32Values.map((bytes32) => {
    const deployment = new SubgraphDeploymentID(bytes32);
    return {
      bytes32,
      ipfsHash: deployment.ipfsHash,
    };
  });

  describe("SubgraphName", () => {
    describe("constructor", () => {
      it("should create a SubgraphName with valid name", () => {
        const name = new SubgraphName("uniswap/uniswap-v3");
        expect(name.value).toBe("uniswap/uniswap-v3");
        expect(name.kind).toBe("name");
      });

      it("should handle empty string", () => {
        const name = new SubgraphName("");
        expect(name.value).toBe("");
      });

      it("should handle special characters", () => {
        const name = new SubgraphName("graph-protocol/graph-node-test_123");
        expect(name.value).toBe("graph-protocol/graph-node-test_123");
      });
    });

    describe("toString", () => {
      it("should return the name value", () => {
        const name = new SubgraphName("example/subgraph");
        expect(name.toString()).toBe("example/subgraph");
      });
    });

    describe("properties", () => {
      it("should have correct kind property", () => {
        const name = new SubgraphName("test");
        expect(name.kind).toBe("name");
      });
    });
  });

  describe("SubgraphDeploymentID", () => {
    // Generate valid test cases by starting with bytes32 and getting IPFS hash
    const testBytes32 = "0x7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89";
    const testDeployment = new SubgraphDeploymentID(testBytes32);
    const testIpfsHash = testDeployment.ipfsHash;

    // Additional known valid pair for testing
    const knownPair = {
      ipfsHash: "QmdwBHGxokamYsLfMVk6fXfry3Ss9emEiTy6wptd1ecysG",
      bytes32: "0xe7b79e8051d136a6ab0ffd6016c7b7fd96dc63e220fe4071021844f36796398b",
    };

    describe("constructor with IPFS hash", () => {
      it("should accept valid IPFS hash format", () => {
        const deployment = new SubgraphDeploymentID(testIpfsHash);
        expect(deployment.value).toBe(testBytes32);
        expect(deployment.kind).toBe("deployment-id");
      });

      it("should handle different valid IPFS hashes", () => {
        // Create some other valid test cases
        const otherBytes32Values = [
          "0x9c06ef17d7332e3681b7a615bfc45557fe2d2eb464d6ff0a5fb4ad56183e5045",
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        ];

        otherBytes32Values.forEach((bytes32) => {
          const tempDeployment = new SubgraphDeploymentID(bytes32);
          const ipfsHash = tempDeployment.ipfsHash;

          // Test that we can create from the IPFS hash
          expect(() => new SubgraphDeploymentID(ipfsHash)).not.toThrow();
        });
      });

      it("should handle known valid IPFS hash and bytes32 pair", () => {
        // Test with the specific known pair
        const deployment = new SubgraphDeploymentID(knownPair.ipfsHash);
        expect(deployment.value).toBe(knownPair.bytes32);
        expect(deployment.bytes32).toBe(knownPair.bytes32);
        expect(deployment.ipfsHash).toBe(knownPair.ipfsHash);
      });

      it("should reject invalid IPFS hash format", () => {
        const invalidHashes = [
          "Qm", // too short
          "QmYqiSdtKSLaKTcZqGwqTMbp8kPqvyYkmpS1zYKKDmyUJ", // too short
          "QmYqiSdtKSLaKTcZqGwqTMbp8kPqvyYkmpS1zYKKDmyUJYZ", // too long
          "XmYqiSdtKSLaKTcZqGwqTMbp8kPqvyYkmpS1zYKKDmyUJY", // wrong prefix
          "qmYqiSdtKSLaKTcZqGwqTMbp8kPqvyYkmpS1zYKKDmyUJY", // lowercase Q
          "QmYqiSdtKSLaKTcZqGwqTMbp8kPqvyYkmpS1zYKKDmyUJ0", // invalid base58 char
          "QmYqiSdtKSLaKTcZqGwqTMbp8kPqvyYkmpS1zYKKDmyUJO", // invalid base58 char
        ];

        invalidHashes.forEach((hash) => {
          expect(() => new SubgraphDeploymentID(hash)).toThrow(`Invalid subgraph deployment ID: ${hash}`);
        });
      });
    });

    describe("constructor with bytes32", () => {
      it("should accept valid bytes32 format", () => {
        validTestCases.forEach(({ bytes32 }) => {
          const deployment = new SubgraphDeploymentID(bytes32);
          expect(deployment.value).toBe(bytes32);
          expect(deployment.kind).toBe("deployment-id");
        });
      });

      it("should handle different valid bytes32 values", () => {
        const validBytes32 = [
          "0x7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89",
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        ];

        validBytes32.forEach((bytes32) => {
          expect(() => new SubgraphDeploymentID(bytes32)).not.toThrow();
        });
      });

      it("should reject mixed case hex", () => {
        const mixedCase = "0x7D5A99F603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89";
        expect(() => new SubgraphDeploymentID(mixedCase)).toThrow("Invalid subgraph deployment ID");
      });

      it("should handle known valid bytes32 and IPFS pair", () => {
        // Test with the specific known pair in reverse
        const deployment = new SubgraphDeploymentID(knownPair.bytes32);
        expect(deployment.value).toBe(knownPair.bytes32);
        expect(deployment.bytes32).toBe(knownPair.bytes32);
        expect(deployment.ipfsHash).toBe(knownPair.ipfsHash);
      });

      it("should reject invalid bytes32 format", () => {
        const invalidBytes32 = [
          "0x", // too short
          "0x123", // too short
          "7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89", // missing 0x prefix
          "0x7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f8", // 63 chars (should be 64)
          "0x7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f891", // 65 chars
          "0x7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7fgg", // invalid hex chars
          "0X7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89", // uppercase X
        ];

        invalidBytes32.forEach((bytes32) => {
          expect(() => new SubgraphDeploymentID(bytes32)).toThrow(`Invalid subgraph deployment ID: ${bytes32}`);
        });
      });
    });

    describe("constructor with invalid inputs", () => {
      it("should reject non-string inputs", () => {
        const invalidInputs: unknown[] = [null, undefined, 123, {}, [], true, false];

        invalidInputs.forEach((input) => {
          expect(() => new SubgraphDeploymentID(input as string)).toThrow();
        });
      });

      it("should reject empty string", () => {
        expect(() => new SubgraphDeploymentID("")).toThrow("Invalid subgraph deployment ID: ");
      });

      it("should reject random strings", () => {
        const randomStrings = ["hello world", "not-a-valid-id", "12345", "random-string-here"];

        randomStrings.forEach((str) => {
          expect(() => new SubgraphDeploymentID(str)).toThrow(`Invalid subgraph deployment ID: ${str}`);
        });
      });
    });

    describe("toString", () => {
      it("should return the bytes32 value", () => {
        const bytes32 = "0x7d5a99f603f231d53a4f39d1521f98d2e8bb279cf29bebfd0687dc98458e7f89";
        const deployment = new SubgraphDeploymentID(bytes32);
        expect(deployment.toString()).toBe(bytes32);
      });
    });

    describe("bytes32 getter", () => {
      it("should return the bytes32 representation", () => {
        const deployment = new SubgraphDeploymentID(testIpfsHash);
        expect(deployment.bytes32).toBe(testBytes32);
      });

      it("should return the same value when constructed with bytes32", () => {
        const deployment = new SubgraphDeploymentID(testBytes32);
        expect(deployment.bytes32).toBe(testBytes32);
      });
    });

    describe("ipfsHash getter", () => {
      it("should return the IPFS hash representation", () => {
        const deployment = new SubgraphDeploymentID(testBytes32);
        expect(deployment.ipfsHash).toBe(testIpfsHash);
      });

      it("should return the same value when constructed with IPFS hash", () => {
        const deployment = new SubgraphDeploymentID(testIpfsHash);
        expect(deployment.ipfsHash).toBe(testIpfsHash);
      });
    });

    describe("display getter", () => {
      it("should return both formats", () => {
        const deployment = new SubgraphDeploymentID(testIpfsHash);
        const display = deployment.display;

        expect(display).toEqual({
          bytes32: testBytes32,
          ipfsHash: testIpfsHash,
        });
        expect(display.bytes32).toBe(testBytes32);
        expect(display.ipfsHash).toBe(testIpfsHash);
      });
    });

    describe("bidirectional conversion", () => {
      it("should maintain consistency between formats", () => {
        // Test IPFS -> bytes32 -> IPFS
        const fromIpfs = new SubgraphDeploymentID(testIpfsHash);
        expect(fromIpfs.bytes32).toBe(testBytes32);
        expect(fromIpfs.ipfsHash).toBe(testIpfsHash);

        // Test bytes32 -> IPFS -> bytes32
        const fromBytes32 = new SubgraphDeploymentID(testBytes32);
        expect(fromBytes32.ipfsHash).toBe(testIpfsHash);
        expect(fromBytes32.bytes32).toBe(testBytes32);

        // Both should be equivalent
        expect(fromIpfs.value).toBe(fromBytes32.value);
        expect(fromIpfs.toString()).toBe(fromBytes32.toString());
      });

      it("should handle round-trip conversion correctly", () => {
        // IPFS -> SubgraphDeploymentID -> bytes32 -> new SubgraphDeploymentID -> IPFS
        const deployment1 = new SubgraphDeploymentID(testIpfsHash);
        const bytes32Value = deployment1.bytes32;
        const deployment2 = new SubgraphDeploymentID(bytes32Value);
        const finalIpfs = deployment2.ipfsHash;

        expect(finalIpfs).toBe(testIpfsHash);
      });

      it("should handle round-trip conversion with known pair", () => {
        // Test both directions with the known valid pair
        // IPFS -> bytes32
        const fromIpfs = new SubgraphDeploymentID(knownPair.ipfsHash);
        expect(fromIpfs.bytes32).toBe(knownPair.bytes32);

        // bytes32 -> IPFS
        const fromBytes32 = new SubgraphDeploymentID(knownPair.bytes32);
        expect(fromBytes32.ipfsHash).toBe(knownPair.ipfsHash);

        // Both should produce identical objects
        expect(fromIpfs.value).toBe(fromBytes32.value);
        expect(fromIpfs.display).toEqual(fromBytes32.display);
      });
    });

    describe("properties", () => {
      it("should have correct kind property", () => {
        const deployment = new SubgraphDeploymentID(testIpfsHash);
        expect(deployment.kind).toBe("deployment-id");
      });
    });

    describe("edge cases", () => {
      it("should reject invalid IPFS hash edge cases", () => {
        // Test boundary values that should be invalid due to regex constraints
        const invalidEdgeCases = [
          "Qm111111111111111111111111111111111111111111111", // all 1s - might be invalid base58 decode
          "QmZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ", // all Zs - invalid base58 characters (Z not in charset)
        ];

        invalidEdgeCases.forEach((hash) => {
          expect(() => new SubgraphDeploymentID(hash)).toThrow("Invalid subgraph deployment ID");
        });
      });

      it("should handle boundary bytes32 values", () => {
        const edgeCases = [
          "0x0000000000000000000000000000000000000000000000000000000000000000", // all zeros
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", // all ones
        ];

        edgeCases.forEach((bytes32) => {
          expect(() => new SubgraphDeploymentID(bytes32)).not.toThrow();
        });
      });
    });

    describe("security and validation", () => {
      it("should protect against regex injection", () => {
        const maliciousInputs = ["0x.*{64}", "Qm.*{44}", "/0x[0-9a-f]{64}/", "\\x00\\x00"];

        maliciousInputs.forEach((input) => {
          expect(() => new SubgraphDeploymentID(input)).toThrow();
        });
      });

      it("should handle Unicode and special characters", () => {
        const unicodeInputs = [
          "Qm🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄🦄",
          "0x©ƒ∂ßå®†¥¨ˆøπåß∂ƒ˙∆˚¬Ω≈ç√∫˜µ≤≥÷åß∂ƒ˙∆˚¬Ω≈ç√∫˜µ≤≥÷",
          "QmА Б В Г Д Е Ё Ж З И Й К Л М Н О П Р С Т У Ф Х", // Cyrillic
        ];

        unicodeInputs.forEach((input) => {
          expect(() => new SubgraphDeploymentID(input)).toThrow();
        });
      });
    });
  });
});
