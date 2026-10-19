import {
    normaliseStatus,
    isHealthyStatus,
    countPendingRequests,
    areAllCredentialsValid,
    getExpiryDateValue,
    getExpiryState,
    EXPIRING_SOON_DAYS,
  } from "../../components/home/home.helpers";
  
  describe("home.helpers", () => {
    describe("normaliseStatus", () => {
      it("trims and lowercases a status", () => {
        expect(normaliseStatus("  VALID  ")).toBe("valid");
      });
  
      it("returns an empty string for undefined", () => {
        expect(normaliseStatus(undefined)).toBe("");
      });
  
      it("returns an empty string for an empty status", () => {
        expect(normaliseStatus("")).toBe("");
      });
    });
  
    describe("isHealthyStatus", () => {
      it("returns true for healthy statuses", () => {
        expect(isHealthyStatus("valid")).toBe(true);
        expect(isHealthyStatus(" approved ")).toBe(true);
        expect(isHealthyStatus("ACCEPTED")).toBe(true);
        expect(isHealthyStatus("issued")).toBe(true);
        expect(isHealthyStatus("active")).toBe(true);
      });
  
      it("returns false for unhealthy statuses", () => {
        expect(isHealthyStatus("pending")).toBe(false);
        expect(isHealthyStatus("revoked")).toBe(false);
        expect(isHealthyStatus(undefined)).toBe(false);
      });
    });
  
    describe("countPendingRequests", () => {
      it("counts pending credentials", () => {
        const credentials = [
          { id: "1", status: "pending" },
          { id: "2", status: " valid " },
          { id: "3", status: "PENDING" },
        ] as any;
  
        expect(countPendingRequests(credentials)).toBe(2);
      });
  
      it("returns 0 when there are no pending credentials", () => {
        const credentials = [
          { id: "1", status: "valid" },
          { id: "2", status: "approved" },
        ] as any;
  
        expect(countPendingRequests(credentials)).toBe(0);
      });
    });
  
    describe("areAllCredentialsValid", () => {
      it("returns true when all credentials are healthy", () => {
        const credentials = [
          { id: "1", status: "valid" },
          { id: "2", status: "approved" },
          { id: "3", status: "issued" },
        ] as any;
  
        expect(areAllCredentialsValid(credentials)).toBe(true);
      });
  
      it("returns false when one credential is unhealthy", () => {
        const credentials = [
          { id: "1", status: "valid" },
          { id: "2", status: "pending" },
        ] as any;
  
        expect(areAllCredentialsValid(credentials)).toBe(false);
      });
  
      it("returns false for an empty credential list", () => {
        expect(areAllCredentialsValid([])).toBe(false);
      });
    });

    describe("getExpiryDateValue", () => {
      it("returns undefined for missing credential", () => {
        expect(getExpiryDateValue(undefined)).toBeUndefined();
      });

      it("returns validUntil from top-level field", () => {
        expect(getExpiryDateValue({ validUntil: "2030-01-01" } as any)).toBe("2030-01-01");
      });

      it("returns expiryDate from parsedDocument credentialSubject", () => {
        const credential = {
          raw: { parsedDocument: { credentialSubject: { expiryDate: "2030-06-01" } } },
        } as any;
        expect(getExpiryDateValue(credential)).toBe("2030-06-01");
      });

      it("returns undefined when no expiry fields exist", () => {
        expect(getExpiryDateValue({} as any)).toBeUndefined();
      });
    });

    describe("getExpiryState", () => {
      it("returns 'missing' for undefined credential", () => {
        expect(getExpiryState(undefined)).toBe("missing");
      });

      it("returns 'valid' for revoked credentials", () => {
        expect(getExpiryState({ status: "revoked" } as any)).toBe("valid");
      });

      it("returns 'missing' when no expiry date is found", () => {
        expect(getExpiryState({} as any)).toBe("missing");
      });

      it("returns 'invalid' for an unparseable expiry date", () => {
        expect(getExpiryState({ validUntil: "not-a-date" } as any)).toBe("invalid");
      });

      it("returns 'expired' when expiry date is in the past", () => {
        expect(getExpiryState({ validUntil: "2000-01-01T00:00:00Z" } as any)).toBe("expired");
      });

      it("returns 'expiring' when within expiring-soon threshold", () => {
        const soon = new Date();
        soon.setDate(soon.getDate() + EXPIRING_SOON_DAYS - 1);
        expect(getExpiryState({ validUntil: soon.toISOString() } as any)).toBe("expiring");
      });

      it("returns 'valid' when expiry is beyond the threshold", () => {
        const far = new Date();
        far.setDate(far.getDate() + EXPIRING_SOON_DAYS + 10);
        expect(getExpiryState({ validUntil: far.toISOString() } as any)).toBe("valid");
      });
    });
  });