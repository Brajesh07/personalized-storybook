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
  gender: z.enum(['Boy', 'Girl'], { required_error: 'Gender is required' }),
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
    <form onSubmit={wrappedSubmit} className="space-y-8 w-full">
      {/* Child Name */}
      <div className="flex flex-col gap-2">
        <label className="text-base font-bold text-[#2D2D2D] uppercase tracking-wide">
          Child’s Name
        </label>
        <input
          type="text"
          {...register('childName')}
          className="border-2 border-[#7DD3DC] rounded-xl px-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#FF9B4A] bg-[#F5F5F5]"
        />
        {errors.childName && (
          <p className="text-sm text-red-600 font-semibold">
            {errors.childName.message}
          </p>
        )}
      </div>

      {/* Child Age */}
      <div className="flex flex-col gap-2">
        <label className="text-base font-bold text-[#2D2D2D] uppercase tracking-wide">
          Child’s Age
        </label>
        <input
          type="number"
          {...register('childAge', { valueAsNumber: true })}
          min={0}
          max={12}
          className="border-2 border-[#7DD3DC] rounded-xl px-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#FF9B4A] bg-[#F5F5F5]"
        />
        {errors.childAge && (
          <p className="text-sm text-red-600 font-semibold">
            {errors.childAge.message}
          </p>
        )}
      </div>

      {/* Gender */}
      <div className="flex flex-col gap-2">
        <label className="text-base font-bold text-[#2D2D2D] uppercase tracking-wide">
          Gender
        </label>
        <select
          {...register('gender')}
          className="border-2 border-[#7DD3DC] rounded-xl px-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#FF9B4A] bg-[#F5F5F5]"
        >
          <option value="">Select gender</option>
          <option value="Boy">Boy</option>
          <option value="Girl">Girl</option>
        </select>
        {errors.gender && (
          <p className="text-sm text-red-600 font-semibold">
            {errors.gender.message}
          </p>
        )}
      </div>

      {/* Photos */}
      <div className="flex flex-col gap-2">
        <label className="text-base font-bold text-[#2D2D2D] uppercase tracking-wide">
          Upload Photo(s)
        </label>
        <input
          type="file"
          {...register('photos')}
          accept="image/*"
          multiple
          className="border-2 border-[#7DD3DC] rounded-xl px-4 py-3 text-lg font-medium bg-[#F5F5F5]"
        />
        {errors.photos && (
          <p className="text-sm text-red-600 font-semibold">
            {errors.photos.message as string}
          </p>
        )}
      </div>

      {/* CTA Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex items-center justify-center px-6 py-3 bg-[#FF9B4A] text-white font-bold rounded-full shadow hover:bg-[#e88a3c] transition-colors text-lg uppercase tracking-wide disabled:opacity-50"
      >
        {isSubmitting ? 'Generating...' : 'Generate Story'}
      </button>
    </form>
  );
};

export default StoryForm;
