using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerController : MonoBehaviour
{

    public CharacterController characterController;
    public Animator animator;
    public float moveSpeed, AirMoveSpeedMultiplier, jumpSpeed, gravity, decayFactor;

    private Vector3 velocity;
    private bool isOnGround, isWalking, isJumping;

    void Start()
    {
        velocity = new Vector3(0, 0, 0);
    }

    void Update()
    {
        isOnGround = characterController.isGrounded;
        Vector3 move = transform.forward * Input.GetAxisRaw("Vertical") + transform.right * Input.GetAxisRaw("Horizontal");
        move.Normalize();

        velocity += move * Time.deltaTime * moveSpeed * (isOnGround ? 1 : AirMoveSpeedMultiplier);

        if (Input.GetButton("Jump") && isOnGround)
        {
            velocity.y = jumpSpeed;
        }

        velocity.y -= gravity * Time.deltaTime;

        velocity.x *= decayFactor;
        velocity.z *= decayFactor;

        characterController.Move(velocity * Time.deltaTime);

        isWalking = move.magnitude != 0;
        isJumping = velocity.y > 0;

        animator.SetBool("isWalking", isWalking);
        animator.SetBool("isJumping", isJumping);

        Application.ExternalCall("gameData", transform.position, transform.rotation, isWalking, isJumping);
    }
}