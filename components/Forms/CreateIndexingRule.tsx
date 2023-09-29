import { ethers } from "ethers";
import request from "graphql-request";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { SET_INDEXING_RULE_MUTATION } from "../../lib/graphql/queries";
import { IndexingRule } from "../../types/types";
import { useReadLocalStorage } from "usehooks-ts";

export default function CreateIndexingRuleForm({
  mutate,
  defaultValues,
  toggleVisible,
}) {
  const selectedNetwork: string = useReadLocalStorage("network");
  const {
    register,
    reset,
    handleSubmit,
    formState: { isValid, isSubmitting, errors },
  } = useForm<Partial<IndexingRule>>({
    mode: "onChange",
    defaultValues: defaultValues,
  });
  const onSubmit: SubmitHandler<IndexingRule> = async (data: IndexingRule) => {
    data.allocationAmount = ethers.parseEther(data.allocationAmount).toString();
    var variables = {
      rule: { ...data, protocolNetwork: selectedNetwork },
    };

    try {
      await request("/api/agent", SET_INDEXING_RULE_MUTATION, variables);

      toast.success("Successfully created new action.");
      mutate();
      reset();
      toggleVisible();
    } catch (error) {
      console.error("err: " + JSON.stringify(error, undefined, 2));
      toast.error("Failed to create new action.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid w-auto max-w-fit auto-cols-auto grid-rows-1 gap-3 overflow-hidden p-3">
        <input
          type="text"
          placeholder="Deployment ID"
          {...register("identifier", { required: true, maxLength: 80 })}
          className="input-bordered input w-full"
        />

        <input
          type="string"
          placeholder="Allocation Amount"
          {...register("allocationAmount", {
            required: true,
            maxLength: 10,
          })}
          className="input-bordered input w-full"
        />

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">decisionBasis</span>
          </label>
          <select
            {...register("decisionBasis", { required: true })}
            className="select-bordered select"
          >
            <option value="rules">rules</option>
            <option value="never">never</option>
            <option value="always">always</option>
            <option value="offchain">offchain</option>
          </select>
        </div>
        <div className="collapse-arrow collapse">
          <input type="checkbox" />
          <div className="collapse-title text-xl font-medium">Advanced</div>
          <div className="collapse-content">
            <div className="space-y-3">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Identifier Type</span>
                </label>
                <input
                  type="text"
                  placeholder="Identifier Type"
                  defaultValue={"deployment"}
                  {...register("identifierType", {
                    required: true,
                    maxLength: 80,
                  })}
                  className="input-bordered input w-full"
                />
              </div>
              <input
                type="number"
                placeholder="Allocation Lifetime"
                {...register("allocationLifetime", { valueAsNumber: true })}
                className="input-bordered input w-full"
              />

              <div className="form-control w-28 justify-center">
                <label className="label cursor-pointer">
                  <span className="label-text pr-3">Auto Renewal</span>
                  <input
                    type="checkbox"
                    placeholder="Auto Renewal"
                    {...register("autoRenewal", {})}
                    className="toggle-accent toggle"
                    defaultChecked
                  />
                </label>
              </div>
              <input
                type="number"
                placeholder="Max Allocation Percentage"
                {...register("maxAllocationPercentage", {
                  valueAsNumber: true,
                })}
                className="input-bordered input w-full"
              />
              <input
                type="number"
                placeholder="Parallel Allocations"
                {...register("parallelAllocations", {
                  valueAsNumber: true,
                })}
                className="input-bordered input w-full"
              />
              {/* <input
              type="text"
              placeholder="Min Signal"
              {...register("minSignal", {})}
              className="input input-bordered w-full"
            />
            <input
              type="text"
              placeholder="Max Signal"
              {...register("maxSignal", {})}
              className="input input-bordered w-full"
            />
            <input
              type="text"
              placeholder="Min Stake"
              {...register("minStake", {})}
              className="input input-bordered w-full"
            />
            <input
              type="text"
              placeholder="Min Average Query Fees"
              {...register("minAverageQueryFees", {})}
              className="input input-bordered w-full"
            /> */}
              <input
                type="text"
                placeholder="Custom"
                {...register("custom")}
                className="input-bordered input w-full"
              />

              <div className="form-control w-28 justify-center">
                <label className="label cursor-pointer">
                  <span className="label-text pr-3">Require Supported</span>
                  <input
                    type="checkbox"
                    placeholder="Require Supported"
                    {...register("requireSupported", {
                      shouldUnregister: true,
                    })}
                    className="toggle-accent toggle"
                    defaultChecked
                  />
                </label>
              </div>

              <div className="form-control w-28 justify-center">
                <label className="label cursor-pointer">
                  <span className="label-text pr-3">Safety</span>
                  <input
                    type="checkbox"
                    placeholder="Safety"
                    {...register("safety", {})}
                    className="toggle-accent toggle"
                    defaultChecked
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="justify-end md:flex">
          <div className="item w-auto">
            <button
              type="submit"
              className={isSubmitting ? "loading btn" : "btn-primary btn"}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? "Loading" : "Create rule"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
