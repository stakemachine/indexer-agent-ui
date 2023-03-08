import request, { gql } from "graphql-request";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { CREATE_ACTION_MUTATION } from "../../lib/graphql/queries";
import { ActionInput, ActionStatus } from "../../types/types";

export default function CreateActionForm({ mutate }) {
  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { isValid, isSubmitting, errors },
  } = useForm({
    mode: "onChange",
  });

  const onSubmit = async (data: ActionInput) => {
    data.source = "Agent UI";
    data.reason = "manual";
    data.status = ActionStatus.QUEUED;
    data.priority = 0;
    if (data.poi == "") {
      data.poi = null;
    }
    let actions: ActionInput[] = [data];
    var variables = {
      actions: actions,
    };

    try {
      await request("/api/agent", CREATE_ACTION_MUTATION, variables);

      toast.success("Successfully created new action.");
      reset();
      mutate();
    } catch (error) {
      console.error("err: " + JSON.stringify(error, undefined, 2));
      toast.error("Failed to create new action.");
    }
  };

  const watchActionType = watch("type");

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid w-auto max-w-fit auto-cols-auto grid-rows-1 gap-3 overflow-hidden p-3">
        <div className="box">
          <div className="item w-32">
            <select
              {...register("type", { required: true })}
              className="select select-bordered"
            >
              <option value="allocate">Allocate</option>
              <option value="unallocate">Unallocate</option>
              <option value="reallocate">Reallocate</option>
            </select>
          </div>
        </div>
        <div className="box col-start-2 col-end-7">
          <div className="flex flex-col flex-nowrap gap-3">
            <div className="gap-3 space-y-3 md:flex md:space-y-0">
              <div className="item md:w-96 lg:min-w-[30rem]">
                <input
                  type="text"
                  placeholder="Deployment ID"
                  {...register("deploymentID", { required: true })}
                  className="input input-bordered w-full"
                />
              </div>

              <div className="item md:w-36">
                <input
                  type="text"
                  placeholder="Amount"
                  {...register("amount", {})}
                  className="input input-bordered w-full"
                  disabled={
                    watchActionType === "reallocate" ||
                    watchActionType === "allocate"
                      ? false
                      : true
                  }
                />
              </div>
            </div>

            <div className="gap-3 md:flex">
              <div className="item min-w-[27rem]">
                <input
                  placeholder="Allocation ID"
                  {...register("allocationID", { shouldUnregister: true })}
                  className="input input-bordered w-full"
                  disabled={
                    watchActionType === "reallocate" ||
                    watchActionType === "unallocate"
                      ? false
                      : true
                  }
                />
              </div>
            </div>

            <div className="gap-3 md:flex">
              <div className="item min-w-[27rem]">
                <input
                  placeholder="POI"
                  {...register("poi", { shouldUnregister: true })}
                  className="input input-bordered w-full"
                  disabled={
                    watchActionType === "reallocate" ||
                    watchActionType === "unallocate"
                      ? false
                      : true
                  }
                />
              </div>
              <div className="form-control w-28 justify-center">
                <label className="label cursor-pointer">
                  <span className="label-text">Force</span>
                  <input
                    type="checkbox"
                    placeholder="Force"
                    {...register("force", { shouldUnregister: true })}
                    className="toggle toggle-accent"
                    disabled={
                      watchActionType === "reallocate" ||
                      watchActionType === "unallocate"
                        ? false
                        : true
                    }
                  />
                </label>
              </div>
            </div>

            <div className="justify-end md:flex">
              <div className="item w-auto">
                <button
                  type="submit"
                  className={isSubmitting ? "btn loading" : "btn btn-primary"}
                  disabled={!isValid || isSubmitting}
                >
                  {isSubmitting ? "Loading" : "Create action"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
