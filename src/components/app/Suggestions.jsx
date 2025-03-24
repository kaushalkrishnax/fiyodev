import React from "react";
import UserCard from "./UserCard";

const Suggestions = () => {
  const suggestions = [
    {
      id: 1,
      username: "user1",
      full_name: "User One",
      avatar: "https://i.pravatar.cc/200",
    },
    {
      id: 2,
      username: "user2",
      full_name: "User Two",
      avatar: "https://i.pravatar.cc/150",
    },
    {
      id: 3,
      username: "user3",
      full_name: "User Three",
      avatar: "https://i.pravatar.cc/100",
    },
    {
      id: 4,
      username: "user4",
      full_name: "User Four",
      avatar: "https://i.pravatar.cc/200",
    },
    {
      id: 5,
      username: "user5",
      full_name: "User Five",
      avatar: "https://i.pravatar.cc/150",
    },
    {
      id: 6,
      username: "user6",
      full_name: "User Six",
      avatar: "https://i.pravatar.cc/100",
    },
  ];

  return (
    <div className="bg-body-bg dark:bg-body-bg-dark rounded-lg p-4 sticky top-2 max-w-sm">
      <h2 className="text-xl text-gray-900 dark:text-white font-bold mb-4">
        Suggestions For You
      </h2>
      <div className="flex flex-col gap-6">
        {suggestions.map((user) => (
          <div key={user.id} className="flex items-center justify-between">
            <UserCard user={user} variant="sm" />
            <button className="text-blue-500 font-semibold hover:text-blue-600 cursor-pointer">
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Suggestions;
