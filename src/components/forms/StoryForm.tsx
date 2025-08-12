import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const StoryFormSchema = z.object({
  childName: z.string().min(1, 'Name is required'),
  childAge: z
    .number()
    .min(0, 'Age must be at least 0')
    .max(12, 'Age must be at most 12'),
  photos: z
    .any()
    .refine((files) => files?.length > 0, 'At least one photo is required')
    .refine((files) => files.length <= 2, 'No more than 2 photos'),
});

export type StoryFormInputs = z.infer<typeof StoryFormSchema>;

interface StoryFormProps {
  onSubmit: SubmitHandler<StoryFormInputs>;
}

export const StoryForm: React.FC<StoryFormProps> = ({ onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<StoryFormInputs>({
    resolver: zodResolver(StoryFormSchema),
  });

  const wrappedSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
    reset(); // <-- Clear the form fields
  });

  return (
    <form onSubmit={wrappedSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium">Child’s Name</label>
        <input
          type="text"
          {...register('childName')}
          className="mt-1 block w-full border rounded px-3 py-2"
        />
        {errors.childName && (
          <p className="mt-1 text-sm text-red-600">
            {errors.childName.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Child’s Age</label>
        <input
          type="number"
          {...register('childAge', { valueAsNumber: true })}
          min={0}
          max={12}
          className="mt-1 block w-full border rounded px-3 py-2"
        />
        {errors.childAge && (
          <p className="mt-1 text-sm text-red-600">{errors.childAge.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Upload Photo(s)</label>
        <input
          type="file"
          {...register('photos')}
          accept="image/*"
          multiple
          className="mt-1 block w-full"
        />
        {errors.photos && (
          <p className="mt-1 text-sm text-red-600">
            {errors.photos.message as string}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {isSubmitting ? 'Generating...' : 'Generate Story'}
      </button>
    </form>
  );
};

export default StoryForm;
