import request from "graphql-request";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { SET_COST_MODEL_MUTATION } from "../../lib/graphql/queries";
import { SubgraphDeploymentID } from "../../lib/subgraphs";
import { CostModel } from "../../types/types";

export type SubgraphDeploymentIDIsh = SubgraphDeploymentID | "all" | "global";

export const parseDeploymentID = (s: string): SubgraphDeploymentIDIsh => {
  if (s === "all" || s === "global") {
    return s;
  } else {
    return new SubgraphDeploymentID(s);
  }
};

export default function CreateCostModelForm({ mutate }) {
  const {
    register,
    reset,
    handleSubmit,
    formState: { isValid, isSubmitting, errors },
  } = useForm<Partial<CostModel>>({
    mode: "onChange",
  });
  const onSubmit: SubmitHandler<CostModel> = async (data: CostModel) => {
    data.deployment = parseDeploymentID(data.deployment).toString();
    var variables = {
      costModel: data,
    };

    try {
      await request("/api/agent", SET_COST_MODEL_MUTATION, variables);

      toast.success("Successfully created new cost model.");
      reset();
      mutate();
    } catch (error) {
      console.error("err: " + JSON.stringify(error, undefined, 2));
      toast.error("Failed to create new cost model.");
    }
  };
  console.log(errors);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid auto-cols-auto grid-rows-1 gap-3 overflow-hidden p-3">
        <input
          type="text"
          placeholder="Deployment ID"
          {...register("deployment", { required: true, maxLength: 80 })}
          className="input input-bordered w-full"
        />

        <textarea
          placeholder="Model"
          {...register("model", {})}
          className="textarea textarea-bordered w-full"
        ></textarea>

        <textarea
          {...register("variables", {})}
          className="textarea textarea-bordered w-full"
          placeholder="Variables"
        ></textarea>

        <div className="justify-end md:flex">
          <div className="item w-auto">
            <button
              type="submit"
              className={isSubmitting ? "btn loading" : "btn btn-primary"}
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
