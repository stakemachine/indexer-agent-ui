import request, { gql } from "graphql-request";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { CREATE_ACTION_MUTATION } from "../../lib/graphql/queries";
import { ActionInput, ActionStatus } from "../../types/types";

export default function CreateActionForm({
  mutate,
  defaultValues,
  toggleVisible,
}) {
  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { isValid, isSubmitting, errors },
  } = useForm<ActionInput>({
    mode: "onChange",
    defaultValues: defaultValues,
  });

  const onSubmit = async (data: ActionInput) => {
    data.source = "Agent UI";
    data.reason = "manual";
    data.priority = 0;
    console.log(data);
    switch (data.poi) {
      case "0x0":
        data.poi =
          "0x0000000000000000000000000000000000000000000000000000000000000000";
        break;
      case "":
        data.poi = null;
        break;
      default:
        break;
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
      toggleVisible();
    } catch (error) {
      console.log(error);
      toast.error("Failed to create new action.");
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } pointer-events-auto flex w-full max-w-xl rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5`}
          >
            <div className="w-0 flex-1 p-4">
              <div className="flex items-start">
                <div className="ml-3 flex-1">
                  <p className="mt-1 text-sm text-gray-500">{error?.message}</p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="flex w-full items-center justify-center rounded-none rounded-r-lg border border-transparent p-4 text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        ),
        {
          duration: 10000,
        }
      );
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
              className="select-bordered select"
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
                  className="input-bordered input w-full"
                />
              </div>

              <div className="item md:w-36">
                <input
                  type="text"
                  placeholder="Amount"
                  {...register("amount", {})}
                  className="input-bordered input w-full"
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
                <div>
                  <input
                    placeholder="Allocation ID"
                    {...register("allocationID", {
                      shouldUnregister: true,
                      pattern: {
                        value: /^0x[a-fA-F0-9]{40}$/,
                        message: "Invalid Allocation ID",
                      },
                    })}
                    className="input-bordered input w-full"
                    disabled={
                      watchActionType === "reallocate" ||
                      watchActionType === "unallocate"
                        ? false
                        : true
                    }
                  />
                </div>
                <div className="text-red-800">
                  {errors?.allocationID?.message}
                </div>
              </div>
            </div>

            <div className="gap-3 md:flex">
              <div className="item min-w-[27rem]">
                <div>
                  <input
                    placeholder="POI"
                    {...register("poi", {
                      shouldUnregister: true,
                      pattern: {
                        value: /^0x([a-fA-F0-9]{64}|0)$/,
                        message: "Invalid POI",
                      },
                    })}
                    className="input-bordered input w-full"
                    disabled={
                      watchActionType === "reallocate" ||
                      watchActionType === "unallocate"
                        ? false
                        : true
                    }
                  />
                </div>
                <div className="text-red-800">{errors?.poi?.message}</div>
              </div>
              <div className="form-control w-28 justify-center">
                <label className="label cursor-pointer">
                  <span className="label-text">Force</span>
                  <input
                    type="checkbox"
                    placeholder="Force"
                    {...register("force", { shouldUnregister: true })}
                    className="toggle-accent toggle"
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

            <div className="justify-end space-x-2 md:flex">
              <div className="item w-auto">
                <select
                  {...register("status", { required: true })}
                  className="select-bordered select"
                >
                  <option value={ActionStatus.QUEUED}>
                    {ActionStatus.QUEUED}
                  </option>
                  <option value={ActionStatus.APPROVED}>
                    {ActionStatus.APPROVED}
                  </option>
                </select>
              </div>
              <div className="item w-auto">
                <button
                  type="submit"
                  className={isSubmitting ? "loading btn" : "btn-primary btn"}
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
